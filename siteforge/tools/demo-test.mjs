import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const studioPort = 5188
const api = spawn('npx.cmd', ['tsx', 'packages/generator/src/index.ts'], { cwd: ROOT, stdio: 'ignore', shell: true })
const studio = spawn('npx.cmd', ['vite', '--port', String(studioPort), '--strictPort'], { cwd: `${ROOT}\\packages\\studio`, stdio: 'ignore', shell: true })

const waitUp = (port, p = '/') => new Promise(resolve => {
  let n = 0
  const iv = setInterval(async () => { n++; if (n > 120) { clearInterval(iv); resolve(false) }; try { const r = await fetch(`http://localhost:${port}${p}`); if (r.ok) { clearInterval(iv); resolve(true) } } catch {} }, 500)
})

try {
  const up = await waitUp(studioPort)
  console.log('studio up:', up)
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errs = []
  page.on('pageerror', e => errs.push(String(e)))
  await page.goto(`http://localhost:${studioPort}/`, { waitUntil: 'domcontentloaded' })
  await sleep(1500)

  // select Personal Site, navigate to features step
  await page.click('.option:has(.option-label:text-is("Personal Site"))')
  await sleep(300)
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => Array.from(document.querySelectorAll('.wizard-footer button')).find(b => b.textContent?.includes('Next'))?.click())
    await sleep(450)
  }
  await sleep(700)

  const results = {}
  // FORCE IntersectionObserver: scroll each demo into view, sample during animation
  const demos = await page.evaluate(async () => {
    const out = {}
    const cards = Array.from(document.querySelectorAll('.anim-pick'))
    const pick = async (sel, sample) => {
      const el = document.querySelector(sel)
      if (!el) return null
      el.scrollIntoView({ block: 'center' })
      await new Promise(r => setTimeout(r, 250))
      return sample()
    }
    out.reveal = await pick('.anim-picker .anim-pick:nth-of-type(1) .demo-chip', () => ({
      animName: getComputedStyle(document.querySelector('.anim-picker .anim-pick:nth-of-type(1) .demo-chip')).animationName,
      opacity: getComputedStyle(document.querySelector('.anim-picker .anim-pick:nth-of-type(1) .demo-chip')).opacity
    }))
    out.cascade = await pick('.anim-picker .anim-pick:nth-of-type(3) .word', () => ({
      animName: getComputedStyle(document.querySelector('.anim-picker .anim-pick:nth-of-type(3) .word')).animationName,
      opacity: getComputedStyle(document.querySelector('.anim-picker .anim-pick:nth-of-type(3) .word')).opacity,
      delay: getComputedStyle(document.querySelector('.anim-picker .anim-pick:nth-of-type(3) .word')).animationDelay
    }))
    out.tilt = await pick('.tilt-stage', () => {
      const card = document.querySelector('.demo-tilt-card')
      return card ? { idleAnim: getComputedStyle(document.querySelector('.demo-tilt-outer')).animationName } : null
    })
    return out
  })
  console.log('demographics:', JSON.stringify(demos, null, 2))

  // Tilt mousemove changes transform
  const tiltMoved = await page.evaluate(async () => {
    const stage = document.querySelector('.tilt-stage')
    if (!stage) return false
    stage.scrollIntoView({ block: 'center' })
    await new Promise(r => setTimeout(r, 250))
    const box = stage.getBoundingClientRect()
    stage.dispatchEvent(new MouseEvent('mousemove', { clientX: box.left + box.width * 0.9, clientY: box.top + box.height * 0.1, bubbles: true }))
    await new Promise(r => setTimeout(r, 120))
    const card = document.querySelector('.demo-tilt-card')
    const t = card ? card.style.transform : ''
    stage.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    return /rotateY/.test(t)
  })
  console.log('tilt transform on move:', tiltMoved)

  const revealOk = !!demos.reveal && demos.reveal.animName.includes('fade-up')
  const cascadeOk = !!demos.cascade && demos.cascade.animName.includes('word-in') && demos.cascade.delay !== '0s'
  console.log('JS errors:', errs.length ? errs.slice(0, 4).join(' | ') : 'none')
  await browser.close()
  const ok = up && revealOk && cascadeOk && tiltMoved && errs.length === 0
  console.log(ok ? 'ALL DEMO PREVIEWS PASS' : 'FAIL demo previews')
  process.exit(ok ? 0 : 1)
} finally {
  try { spawn('taskkill', ['/F', '/PID', String(api.pid), '/T'], { stdio: 'ignore', shell: true }) } catch {}
  try { spawn('taskkill', ['/F', '/PID', String(studio.pid), '/T'], { stdio: 'ignore', shell: true }) } catch {}
}