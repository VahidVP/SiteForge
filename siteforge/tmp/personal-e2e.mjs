import { chromium } from 'playwright-core'
const ORIGIN = process.env.ORIGIN || 'http://localhost:5174'
const results = []
function check(name, ok, extra = '') { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`) }

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage()

function collect() {
  const errs = []
  page.on('pageerror', e => errs.push('pageerror:' + e.message))
  page.on('console', m => { if (m.type() === 'error' && !/404|favicon|Failed to load resource/.test(m.text())) errs.push(m.text()) })
  return errs
}

// portfolio page lists seeded projects with API
{
  const errs = collect()
  await page.goto(ORIGIN + '/portfolio', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const cards = await page.evaluate(() => Array.from(document.querySelectorAll('a[href^="/portfolio/"]')).map(a => a.getAttribute('href')))
  const text = await page.evaluate(() => document.body.innerText)
  check('portfolio lists cards', cards.length >= 3, JSON.stringify(cards))
  check('portfolio shows project names', /E-Commerce|Crypto|Dashboard|project/i.test(text))
  check('portfolio no page errors', errs.length === 0, errs.join(' | ').slice(0, 200))
}

// portfolio detail: renders content + gallery
{
  const errs = collect()
  const first = await page.evaluate(() => document.querySelector('a[href^="/portfolio/"]')?.getAttribute('href'))
  await page.goto(ORIGIN + first, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const text = await page.evaluate(() => document.body.innerText)
  const imgs = await page.evaluate(() => document.querySelectorAll('.gallery img, .detail-gallery img, img.gallery-img').length)
  check('portfolio detail renders', text.length > 80, text.slice(0, 90).replace(/\n/g, ' '))
  check('portfolio detail has back link', await page.evaluate(() => !!document.querySelector('a[href="/portfolio"]')))
  check('portfolio detail gallery img present', imgs > 0, `imgs=${imgs}`)
  check('portfolio detail no page errors', errs.length === 0, errs.join(' | ').slice(0, 200))
}

// lightbox: click gallery image -> overlay appears, esc closes
{
  await page.locator('.gallery img, .detail-gallery img, img.gallery-img').first().click()
  await page.waitForTimeout(700)
  const overlay = await page.evaluate(() => !!document.querySelector('.lightbox, [class*="lightbox"]'))
  check('lightbox overlay opens on image click', overlay)
  if (overlay) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    check('lightbox closes on Escape', await page.evaluate(() => !document.querySelector('.lightbox-overlay, .lightbox[style*="flex"], [class*="lightbox"][style*="pointer"]')))
  }
}

await browser.close()
const failed = results.filter(r => !r.ok)
console.log(`\n===== PERSONAL E2E =====`)
console.log(`${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)