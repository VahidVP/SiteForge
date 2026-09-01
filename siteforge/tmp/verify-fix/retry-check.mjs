import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const studioPort = 5192

let pass = 0, fail = 0
const check = (name, ok, detail = '') => { if (ok) { pass++; console.log(`  ok  ${name}`) } else { fail++; console.log(`FAIL  ${name} ${detail}`) } }

// Start ONLY the studio — NO api, on purpose.
const studio = spawn('npx.cmd', ['vite', '--port', String(studioPort), '--strictPort'], { cwd: `${ROOT}\\packages\\studio`, stdio: 'ignore', shell: true })

const waitUp = (port) => new Promise(resolve => {
  let n = 0
  const iv = setInterval(async () => { n++; if (n > 120) { clearInterval(iv); resolve(false) }; try { const r = await fetch(`http://localhost:${port}/`); if (r.ok) { clearInterval(iv); resolve(true) } } catch {} }, 500)
})

let api = null
try {
  const up = await waitUp(studioPort)
  console.log('studio up:', up)
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(`http://localhost:${studioPort}/`, { waitUntil: 'domcontentloaded' })

  // with the API down, the retries exhaust and the error screen appears (with a retry button)
  await page.waitForSelector('.error-card button.btn-primary', { timeout: 20000 })
  const btnText = await page.textContent('.error-card button.btn-primary')
  check('error screen shows a Try again button', btnText === 'Try again', btnText)
  const errText = await page.textContent('.error-card')
  check('message is the clear actionable error', errText?.includes('npm run dev:api'), errText)

  // now bring the API up and press Try again
  api = spawn('npx.cmd', ['tsx', 'packages/generator/src/index.ts'], { cwd: ROOT, stdio: 'ignore', shell: true })
  await sleep(4000)
  await page.click('.error-card button.btn-primary')
  await page.waitForSelector('.option', { timeout: 20000 })
  const opts = await page.locator('.option').count()
  check('studio recovers via retry button (catalog loaded)', opts >= 3, String(opts))

  await browser.close()
} finally {
  studio.kill?.()
  api?.kill?.()
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)