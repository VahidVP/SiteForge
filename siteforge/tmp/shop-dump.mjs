import { chromium } from 'playwright-core'
const p = await chromium.launch({ channel: 'msedge', headless: true })
const page = await p.newPage()
const errs = []
page.on('pageerror', e => errs.push(e.message))
await page.goto('http://localhost:5175/products/1', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
console.log('TEXT:', (await page.evaluate(() => document.body.innerText)).slice(0, 300).replace(/\n/g, ' | '))
console.log('IMGS:', JSON.stringify(await page.evaluate(() => Array.from(document.querySelectorAll('img')).map(i => i.src)), null, 0))
console.log('ZOOM BADGES:', await page.evaluate(() => document.querySelectorAll('.zoom-badge').length))
console.log('ERRORS:', errs.join(' ;; '))
await p.close()