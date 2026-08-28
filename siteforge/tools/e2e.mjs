import { execSync, spawn } from 'node:child_process'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const SITE = path.join(ROOT, 'tmp', `e2e-site-${stamp}`)
const FRONT = path.join(SITE, 'frontend')
const BACK = path.join(SITE, 'backend')
const FE_PORT = 5199
const failures = []

function ok(name, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`)
  if (!cond) failures.push(name)
}

async function waitFor(fn, ms = 20000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    try {
      if (await fn()) return true
    } catch {}
    await sleep(400)
  }
  return false
}

function run(cmd, cwd) {
  execSync(cmd, { stdio: 'pipe', shell: true, cwd })
}

async function main() {
  run(`npx tsx packages/generator/src/cli.ts --preset shop --backend dotnet --title "E2E Shop" --out "${SITE}"`, ROOT)
  run('npm install --no-fund --no-audit', FRONT)

  run('dotnet build -v q --nologo', BACK)
  const api = spawn('dotnet', ['run', '--no-build'], { cwd: BACK, stdio: 'ignore', shell: true })
  const fe = spawn('npx.cmd', ['vite', '--port', String(FE_PORT), '--strictPort'], { cwd: FRONT, stdio: 'ignore', shell: true })

  try {
    const up = await waitFor(async () => {
      const res = await fetch('http://localhost:8000/api/pages/home/')
      return res.ok
    })
    ok('backend API is up', up)
    if (!up) throw new Error('backend never started')

    await waitFor(async () => {
      const res = await fetch(`http://localhost:${FE_PORT}/`)
      return res.ok
    })

    const browser = await chromium.launch({ channel: 'msedge', headless: true })
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))

    await page.goto(`http://localhost:${FE_PORT}/`, { waitUntil: 'networkidle' })
    ok('home renders hero title', (await page.textContent('h1')) === 'E2E Shop')
    ok('navbar shows Sign up button', await page.isVisible('text=Sign up'))

    await page.click('text=Sign up')
    await page.waitForURL('**/login**')
    await page.fill('input[type="email"]', 'owner@shop.dev')
    await page.fill('input[type="password"]', 'secret123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    ok('registration lands on dashboard', page.url().includes('/dashboard'))
    ok('owner sees ADMIN badge', await page.isVisible('text=ADMIN'))
    ok('no runtime errors so far', errors.length === 0)

    await page.click('text=Open admin panel')
    await page.waitForURL('**/admin')
    ok('admin panel opens', true)
    let ownerListed = true
    try {
      await page.waitForSelector('td:has-text("owner@shop.dev")', { timeout: 10000 })
    } catch {
      ownerListed = false
    }
    ok('users table lists owner', ownerListed)
    ok('products tab exists for shop', await page.isVisible('text=📦 Products'))

    await page.click('text=📦 Products')
    await page.waitForSelector('text=Add a product')
    await page.fill('input[required] >> nth=0', 'Test Widget')
    await page.locator('input[type="number"]').fill('19.99')
    await page.click('text=+ Add product')
    await sleep(1200)
    ok('new product appears in admin list', await page.isVisible('td >> text=Test Widget'))

    await page.goto(`http://localhost:${FE_PORT}/products`, { waitUntil: 'networkidle' })
    await sleep(800)
    ok('new product visible on public shop page', await page.isVisible('text=Test Widget'))

    ok('zero uncaught JS errors during whole flow', errors.length === 0)
    if (errors.length) console.log(errors.join('\n'))

    await browser.close()
  } finally {
    try { spawn('taskkill', ['/F', '/PID', String(api.pid), '/T'], { stdio: 'ignore', shell: true }) } catch {}
    try { spawn('taskkill', ['/F', '/PID', String(fe.pid), '/T'], { stdio: 'ignore', shell: true }) } catch {}
  }

  console.log(failures.length === 0 ? '\nE2E RESULT: ALL PASS' : `\nE2E RESULT: ${failures.length} FAILURES`)
  process.exit(failures.length ? 1 : 0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
