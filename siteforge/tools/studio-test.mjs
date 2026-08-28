import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const studioPort = 5178

const api = spawn('npx.cmd', ['tsx', 'packages/generator/src/index.ts'], { cwd: ROOT, stdio: 'ignore', shell: true })
const studio = spawn('npx.cmd', ['vite', '--port', String(studioPort), '--strictPort'], { cwd: `${ROOT}\\packages\\studio`, stdio: 'ignore', shell: true })

function waitUp(port, urlPath = '/') {
  return new Promise(resolve => {
    let n = 0
    const iv = setInterval(async () => {
      n++
      if (n > 120) { clearInterval(iv); resolve(false) }
      try { const r = await fetch(`http://localhost:${port}${urlPath}`); if (r.ok) { clearInterval(iv); resolve(true) } } catch {}
    }, 500)
  })
}

try {
  const apiUp = await waitUp(4000, '/api/health')
  const studioUp = await waitUp(studioPort)
  console.log('api up:', apiUp, 'studio up:', studioUp)

  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errs = []
  page.on('pageerror', e => errs.push(String(e)))
  await page.goto(`http://localhost:${studioPort}/`, { waitUntil: 'networkidle' })
  await sleep(1500)

  const next = async () => page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.wizard-footer button'))
    btns.find(b => b.textContent?.includes('بعدی') || b.textContent?.includes('Next'))?.click()
  })

  // pick a site type so "Next" unlocks
  await page.click('.option:has(.option-label:text-is("Personal Site")), .option:has(.option-label:text-is("سایت شخصی"))')
  await sleep(300)

  let labels = await page.evaluate(() => Array.from(document.querySelectorAll('.option-label')).map(e => e.textContent.trim()))
  console.log('EN labels (step0):', labels.slice(0, 6).join(' | '))
  const enOk = labels.includes('Personal Site') && labels.includes('Business Site') && labels.includes('Shop')
  console.log(enOk ? 'PASS en catalog labels' : 'FAIL en catalog labels')

  await page.click('.lang-toggle')
  await sleep(600)
  const dir = await page.evaluate(() => document.documentElement.dir)
  console.log('studio dir after fa switch:', dir)
  labels = await page.evaluate(() => Array.from(document.querySelectorAll('.option-label')).map(e => e.textContent.trim()))
  console.log('FA labels (step0):', labels.slice(0, 6).join(' | '))
  const faOk = dir === 'rtl' && labels.includes('سایت شخصی') && labels.includes('سایت کسب‌وکار') && labels.includes('فروشگاه')
  console.log(faOk ? 'PASS fa site-type labels' : 'FAIL fa site-type labels')

  const allStep0 = await page.evaluate(() => Array.from(document.querySelectorAll('.option-desc')).map(e => e.textContent.trim()))
  const faDescOk = allStep0.some(d => /[آ-ی]/.test(d))
  console.log(faDescOk ? 'PASS fa descriptions' : 'FAIL fa descriptions')

  await next()
  await sleep(500)
  const designText = await page.evaluate(() => document.body.innerText)
  const faDesignOk = designText.includes('تم رنگی') && designText.includes('طراحی هدر') && designText.includes('طراحی هیرو') && designText.includes('راست‌به‌چپ')
  const faTemplateLabels = await page.evaluate(() => Array.from(document.querySelectorAll('.option-label')).map(e => e.textContent.trim()))
  console.log('FA template labels:', faTemplateLabels.slice(0, 6).join(' | '))
  const faTplOk = faTemplateLabels.includes('نیمه‌شب') && faTemplateLabels.includes('اقیانوس') && !faTemplateLabels.includes('سایت شخصی')
  console.log(faDesignOk && faTplOk ? 'PASS fa design+templates' : 'FAIL fa design+templates ' + JSON.stringify({ faDesignOk, faTplOk, faTemplateLabels }))

  await next(); await sleep(400)
  await next(); await sleep(600)

  const picker = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.anim-pick'))
    return {
      count: cards.length,
      checked: cards.filter(c => c.querySelector('input:checked')).length,
      labels: cards.map(c => c.querySelector('.anim-pick-title')?.textContent?.trim() ?? '')
    }
  })
  console.log('anim picker:', JSON.stringify(picker))
  const pickerOk = picker.count === 7 && picker.checked === 2 && picker.labels.filter(l => /[آ-ی]/.test(l)).length === 7
  console.log(pickerOk ? 'PASS anim picker (7 selectable, fa labels)' : 'FAIL anim picker')

  await page.click('.anim-pick >> nth=3')
  await sleep(300)
  const checkedAfter = await page.evaluate(() => document.querySelectorAll('.anim-pick input:checked').length)
  const toggleOk = checkedAfter === 3
  console.log(toggleOk ? 'PASS anim toggle' : 'FAIL anim toggle', 'checked:', checkedAfter)

  console.log('JS errors:', errs.length ? errs.slice(0, 4).join(' | ') : 'none')
  await browser.close()
  if (!(apiUp && studioUp && enOk && faOk && faDescOk && faDesignOk && faTplOk && pickerOk && toggleOk && errs.length === 0)) {
    console.log('FAIL one or more checks')
    process.exit(1)
  }
  console.log('ALL STUDIO CHECKS PASS')
} finally {
  try { spawn('taskkill', ['/F', '/PID', String(api.pid), '/T'], { stdio: 'ignore', shell: true }) } catch {}
  try { spawn('taskkill', ['/F', '/PID', String(studio.pid), '/T'], { stdio: 'ignore', shell: true }) } catch {}
}