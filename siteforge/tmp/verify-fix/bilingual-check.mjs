import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const studioPort = 5190
const api = spawn('npx.cmd', ['tsx', 'packages/generator/src/index.ts'], { cwd: ROOT, stdio: 'ignore', shell: true })
const studio = spawn('npx.cmd', ['vite', '--port', String(studioPort), '--strictPort'], { cwd: `${ROOT}\\packages\\studio`, stdio: 'ignore', shell: true })

const waitUp = (port, path = '/') => new Promise(resolve => {
  let n = 0
  const iv = setInterval(async () => { n++; if (n > 120) { clearInterval(iv); resolve(false) }; try { const r = await fetch(`http://localhost:${port}${path}`); if (r.ok) { clearInterval(iv); resolve(true) } } catch {} }, 500)
})

const next = (page) => page.evaluate(() => Array.from(document.querySelectorAll('.wizard-footer button')).find(b => b.textContent?.includes('بعدی') || b.textContent?.includes('Next'))?.click())

let pass = 0, fail = 0
const check = (name, ok, detail = '') => { if (ok) { pass++; console.log(`  ok  ${name}`) } else { fail++; console.log(`FAIL  ${name} ${detail}`) } }

try {
  const [apiUp, up] = await Promise.all([waitUp(4000, '/api/health'), waitUp(studioPort)])
  console.log('api up:', apiUp, '| studio up:', up)
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(`http://localhost:${studioPort}/`, { waitUntil: 'domcontentloaded' })
  // the catalog fetch can lose a cold-start race and leave an error screen with no
  // retry button — reload once if no options rendered within a few seconds
  const hasOptions = await page.waitForSelector('.option', { timeout: 30000, state: 'attached' }).then(() => true).catch(() => false)
  if (!hasOptions) {
    console.log('catalog fetch raced — reloading')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.option', { timeout: 60000 })
  }
  await sleep(500)

  await page.click('.option:has(.option-label:text-is("Personal Site"))')
  await sleep(300); await next(page); await sleep(500)   // -> design
  // choose Farsi as primary, keep bilingual ON (default) — language lives on the design step
  await page.click('.option:has(.option-label:text-is("فارسی"))')
  await sleep(300); await next(page); await sleep(500)   // -> stack
  await next(page); await sleep(500)                      // -> identity

  const faName = page.locator('.form-card input[dir="rtl"]').nth(0)
  const enName = page.locator('.form-card input[dir="ltr"]').nth(0)
  const faTag = page.locator('.form-card input[dir="rtl"]').nth(1)
  const enTag = page.locator('.form-card input[dir="ltr"]').nth(1)
  const labels = await page.evaluate(() => Array.from(document.querySelectorAll('.form-card .field span')).map(s => s.textContent))
  console.log('field order:', JSON.stringify(labels))
  // studio UI is English, so the labels are "Website name (Farsi)" / "(English)" etc.
  check(
    'Farsi fields come first when primary is Farsi',
    labels?.[0] === 'Website name (Farsi)' && labels?.[1] === 'Website name (English)' &&
      labels?.[2] === 'Tagline (Farsi)' && labels?.[3] === 'Tagline (English)',
    JSON.stringify(labels)
  )
  await enName.fill('EN Brand')
  await faName.fill('برند فارسی')
  await enTag.fill('English tagline here')
  await faTag.fill('شعار فارسی اینجا')
  await sleep(600)

  const preview = await page.evaluate(() => ({
    brand: document.querySelector('.pv-brand-name')?.textContent,
    heroTitle: document.querySelector('.pv-title')?.textContent,
    heroTagline: document.querySelector('.pv-tagline')?.textContent,
    dir: document.querySelector('.browser')?.getAttribute('dir')
  }))
  console.log('preview (primary=fa):', JSON.stringify(preview))

  // capture the payload the studio sends to /api/generate
  let payload = null
  await page.route('**/api/generate', async route => {
    payload = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({ status: 200, contentType: 'application/zip', body: 'PK' })
  })
  await next(page); await sleep(500)   // -> review step (4)
  await page.click('.btn.btn-primary.btn-lg')
  await sleep(1500)
  console.log('payload.branding:', JSON.stringify(payload?.branding))
  console.log('payload.language:', payload?.language, 'bilingual:', payload?.bilingual)

  await browser.close()
} finally {
  api.kill(); studio.kill()
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)