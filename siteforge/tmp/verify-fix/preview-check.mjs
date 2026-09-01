import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const studioPort = 5189
const api = spawn('npx.cmd', ['tsx', 'packages/generator/src/index.ts'], { cwd: ROOT, stdio: 'ignore', shell: true })
const studio = spawn('npx.cmd', ['vite', '--port', String(studioPort), '--strictPort'], { cwd: `${ROOT}\\packages\\studio`, stdio: 'ignore', shell: true })

const waitUp = (port) => new Promise(resolve => {
  let n = 0
  const iv = setInterval(async () => { n++; if (n > 120) { clearInterval(iv); resolve(false) }; try { const r = await fetch(`http://localhost:${port}/`); if (r.ok) { clearInterval(iv); resolve(true) } } catch {} }, 500)
})

let pass = 0, fail = 0
const check = (name, ok, detail = '') => { if (ok) { pass++; console.log(`  ok  ${name}`) } else { fail++; console.log(`FAIL  ${name} ${detail}`) } }

try {
  const up = await waitUp(studioPort)
  console.log('studio up:', up)
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errs = []
  page.on('pageerror', e => errs.push(String(e)))
  await page.goto(`http://localhost:${studioPort}/`, { waitUntil: 'domcontentloaded' })
  await sleep(2000)

  // 0) choose site type, go to design step
  await page.click('.option:has(.option-label:text-is("Personal Site"))')
  await sleep(400)
  await page.evaluate(() => Array.from(document.querySelectorAll('.wizard-footer button')).find(b => b.textContent?.includes('Next'))?.click())
  await sleep(600)

  // 1) Template palette 1:1 — pick Ocean, read the preview's CSS vars
  await page.click('.option:has(.option-label:text-is("Ocean"))')
  await sleep(400)
  const theme = await page.evaluate(() => {
    const el = document.querySelector('.browser')
    const cs = getComputedStyle(el)
    return {
      bgVar: cs.getPropertyValue('--p-bg').trim(),
      accent: cs.getPropertyValue('--p-accent').trim(),
      accent2: cs.getPropertyValue('--p-accent2').trim(),
      bgComputed: cs.backgroundColor
    }
  })
  check('ocean --p-bg is exact theme bg', theme.bgVar === '#eaf4fb', theme.bgVar)
  check('ocean --p-accent is exact theme accent', theme.accent === '#0369a1', theme.accent)
  check('ocean --p-accent2 is orange #f59e0b (was wrong before)', theme.accent2 === '#f59e0b', theme.accent2)
  check('.browser paints the template bg, not the studio bg', theme.bgComputed === 'rgb(234, 244, 251)', theme.bgComputed)

  // 2) stay on design step, pick waves hero
  await page.click('.option:has(.option-label:text-is("Waves"))')
  await sleep(500)
  const waves = await page.evaluate(() => {
    const hero = document.querySelector('.pv-hero--waves')
    const floorless = !document.querySelector('.pv-hero--glow') && !document.querySelector('.pv-blob')
    return {
      heroExists: Boolean(hero),
      noGlowBlobs: floorless,
      noAurora: !document.querySelector('.pv-aurora'),
      waveAnim: hero ? getComputedStyle(hero.querySelector('.pv-wave')).animationName : null
    }
  })
  check('waves hero renders', waves.heroExists)
  check('no glow-center blobs stacked on waves hero (overlap bug)', waves.noGlowBlobs)
  check('no aurora glow when anim.aurora off (matches generated site)', waves.noAurora)
  check('waves animate (wave-spin)', waves.waveAnim === 'wave-spin', String(waves.waveAnim))

  // 3) grid hero animation parity
  await page.click('.option:has(.option-label:text-is("Tech Grid"))')
  await sleep(500)
  const grid = await page.evaluate(() => {
    const floor = document.querySelector('.pv-floor')
    return floor ? { anim: getComputedStyle(floor).animationName } : null
  })
  check('grid floor animates (grid-scroll)', grid?.anim === 'grid-scroll', String(grid?.anim))

  check('no page errors', errs.length === 0, errs.join(' | '))
  await browser.close()
} finally {
  api.kill(); studio.kill()
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)