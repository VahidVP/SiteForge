import { execSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'tmp', 'layout')
mkdirSync(OUT, { recursive: true })

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'pipe', shell: true, ...opts })
}

async function checkSite(label, blueprint, expectInitialDir) {
  let dest = path.join(OUT, label)
  rmSync(dest, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
  writeFileSync(path.join(OUT, `${label}.bp.json`), JSON.stringify(blueprint, null, 2))
  run(`npx tsx packages/generator/src/cli.ts --blueprint "${path.join(OUT, label + '.bp.json')}" --out "${dest}"`, { cwd: ROOT })
  const frontDir = path.join(dest, 'frontend')
  run('npm install --no-fund --no-audit', { cwd: frontDir })
  run('npx vite build', { cwd: frontDir })

  const port = 4500 + Math.floor(Math.random() * 50)
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', String(port), '--strictPort'], { cwd: frontDir, stdio: 'ignore', shell: true })
  try {
    let up = false
    for (let a = 0; a < 30; a++) {
      await sleep(500)
      try { const r = await fetch(`http://localhost:${port}/`); if (r.ok) { up = true; break } } catch {}
    }
    if (!up) throw new Error('preview did not start')

    const browser = await chromium.launch({ channel: 'msedge', headless: true })
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
    await sleep(700)

    const snap = () => page.evaluate(() => {
      const brand = document.querySelector('.brand')?.getBoundingClientRect()
      const links = document.querySelector('.nav-links')?.getBoundingClientRect()
      const actions = document.querySelector('.nav-actions')?.getBoundingClientRect()
      return {
        dir: document.documentElement.dir,
        htmlLang: document.documentElement.lang,
        bodyLang: document.body.dataset.lang,
        navDisplay: getComputedStyle(document.querySelector('.nav-inner')).display,
        brandX: brand ? Math.round(brand.left) : null,
        linksX: links ? Math.round(links.left) : null,
        brandLinksRelation: brand && links ? Math.round(links.left - brand.right) : null,
        actionX: actions ? Math.round(actions.left) : null,
        langToggle: !!document.querySelector('.lang-toggle'),
        logoPosition: brand ? (brand.left < 640 ? 'LEFT' : 'RIGHT') : null
      }
    })

    const before = await snap()
    await page.click('.lang-toggle')
    await sleep(500)
    const after = await snap()
    await page.click('.lang-toggle')
    await sleep(500)
    const back = await snap()

    console.log(`\n--- [${label}] initial dir=${expectInitialDir} ---`)
    console.log('BEFORE :', JSON.stringify(before))
    console.log('AFTER  :', JSON.stringify(after))
    console.log('BACK   :', JSON.stringify(back))
    console.log('JS errors:', errors.length ? errors.join(' | ') : 'none')

    const ok =
      before.dir === expectInitialDir &&
      after.dir === (expectInitialDir === 'rtl' ? 'ltr' : 'rtl') &&
      back.dir === expectInitialDir &&
      errors.length === 0
    console.log(ok ? 'PASS' : 'FAIL')

    await browser.close()
    return ok
  } finally {
    try { spawn('taskkill', ['/F', '/PID', String(preview.pid), '/T'], { stdio: 'ignore', shell: true }) } catch {}
  }
}

let pass = 0
const kits = []
if (await checkSite('en-primary', {
  projectName: 'layout-en',
  siteType: 'shop', backend: 'django', database: 'sqlite', template: 'midnight',
  language: 'en', bilingual: true,
  modules: ['pages', 'contact-form', 'auth', 'shop-catalog'], uiModules: ['anim.reveal'],
  headerStyle: 'glass', footerStyle: 'split', heroStyle: 'spotlight',
  branding: { title: 'Layout EN', tagline: 'test' }
}, 'ltr')) pass++
kits.push('en')
if (await checkSite('fa-primary', {
  projectName: 'layout-fa',
  siteType: 'shop', backend: 'django', database: 'sqlite', template: 'midnight',
  language: 'fa', bilingual: true,
  modules: ['pages', 'contact-form', 'auth', 'shop-catalog'], uiModules: ['anim.reveal'],
  headerStyle: 'glass', footerStyle: 'split', heroStyle: 'spotlight',
  branding: { title: 'چیدمان فارسی', tagline: 'تست' }
}, 'rtl')) pass++
kits.push('fa')

console.log(`\n===== RTL/LTR: ${pass}/2 kits PASS =====`)
process.exit(pass === 2 ? 0 : 1)