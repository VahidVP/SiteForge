import { chromium } from 'playwright-core'
const p = await chromium.launch({ channel: 'msedge', headless: true })
const page = await p.newPage()
const errs = []
page.on('pageerror', e => errs.push(e.message))
await page.goto('http://localhost:5175/products/1', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const zoom = await page.evaluate(() => !!document.querySelector('.zoom-badge'))
console.log('zoom badge present:', zoom)
await page.locator('.zoom-badge').click()
await page.waitForTimeout(800)
const overlay = await page.evaluate(() => !!document.querySelector('.lightbox-overlay, .lightbox, [class*="lightbox"]'))
console.log('lightbox open:', overlay)
if (overlay) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  console.log('lightbox closed:', await page.evaluate(() => !document.querySelector('.lightbox-overlay, .lightbox, [class*="lightbox"]')))
}
console.log('page errors:', errs.length)
await p.close()