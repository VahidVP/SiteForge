import { chromium } from 'playwright-core'
const ORIGIN = 'http://localhost:5175'
const results = []
function check(name, ok, extra = '') { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`) }

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage()
const pageErrors = []
page.on('pageerror', e => pageErrors.push(e.message))
page.on('console', m => { if (m.type() === 'error' && !/404|favicon|Failed to load resource/.test(m.text())) pageErrors.push(m.text()) })

// products page lists API products
await page.goto(ORIGIN + '/products', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const cards = await page.evaluate(() => Array.from(document.querySelectorAll('a[href^="/products/"]')).map(a => a.getAttribute('href')))
const text = await page.evaluate(() => document.body.innerText)
check('products lists cards', cards.length >= 3, JSON.stringify(cards))
check('products has names', /Vintage|Ceramic|Jacket|Glass|product/i.test(text))
check('products no page errors', pageErrors.length === 0, pageErrors.slice(0,3).join(' | '))

// no picsum in any product image URL on the page
const picsum = await page.evaluate(() => Array.from(document.querySelectorAll('img')).filter(i => /picsum/i.test(i.src)).length)
check('no picsum image URLs', picsum === 0, `picsum=${picsum}`)

// product detail renders + zoom lightbox on image click
const first = cards[0]
await page.goto(ORIGIN + first, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const dtText = await page.evaluate(() => document.body.innerText)
check('product detail renders', dtText.length > 80, dtText.slice(0, 90).replace(/\n/g, ' '))
check('product detail has zoom trigger', await page.evaluate(() => !!document.querySelector('.zoom-badge, [class*="zoom"], button[aria-label*="zoom" i]')) || await page.evaluate(() => document.body.innerText.includes('zoom') ? true : false))

// click zoom badge -> lightbox overlay
await page.locator('.zoom-badge').click()
await page.waitForTimeout(800)
const overlay = await page.evaluate(() => !!document.querySelector('.lightbox-overlay, .lightbox, [class*="lightbox"]'))
check('lightbox opens on product image', overlay)
if (overlay) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  check('lightbox closes on Escape', await page.evaluate(() => !document.querySelector('.lightbox-overlay, .lightbox, [class*="lightbox"]')))
}

await browser.close()
const failed = results.filter(r => !r.ok)
console.log(`\n===== SHOP E2E =====`)
console.log(`${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)