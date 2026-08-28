import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const ROOT = process.cwd()
const base = `${ROOT}\\tmp\\layout\\en-primary`
const fePort = 5199

const backend = spawn('.venv\\Scripts\\python.exe', ['manage.py', 'runserver', '8000', '--noreload'], { cwd: `${base}\\backend`, stdio: 'ignore', shell: true })
const fe = spawn('npx.cmd', ['vite', '--port', String(fePort), '--strictPort'], { cwd: `${base}\\frontend`, stdio: 'ignore', shell: true })

const waitUp = (port, p = '/') => new Promise(resolve => {
  let n = 0
  const iv = setInterval(async () => { n++; if (n > 80) { clearInterval(iv); resolve(false) }; try { const r = await fetch(`http://localhost:${port}${p}`); if (r.ok) { clearInterval(iv); resolve(true) } } catch {} }, 500)
})

try {
  const apiUp = await waitUp(8000, '/api/products/')
  const feUp = await waitUp(fePort)
  console.log('backend up:', apiUp, 'frontend up:', feUp)

  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errs = []
  page.on('pageerror', e => errs.push(String(e)))

  await page.goto(`http://localhost:${fePort}/`, { waitUntil: 'domcontentloaded' })
  await sleep(1500)
  await page.evaluate(() => localStorage.setItem('cart_items', JSON.stringify([1, 2])))
  await page.goto(`http://localhost:${fePort}/cart`, { waitUntil: 'domcontentloaded' })
  await sleep(1200)

  const cart = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table.data tbody tr'))
    const texts = rows.map(r => r.textContent.trim())
    const body = document.body.innerText
    return {
      rowCount: rows.length,
      rows: texts,
      hasDollar: body.includes('$'),
      hasTooman: /Tooman|تومان/.test(body),
      totalLine: Array.from(document.querySelectorAll('.product-row')).map(e => e.textContent.trim()).join(' | ')
    }
  })
  console.log('cart:', JSON.stringify(cart, null, 2))

  const ok = cart.rowCount >= 2 && !cart.hasDollar && cart.hasTooman && /Tooman|تومان/.test(cart.totalLine)
  console.log(ok ? 'PASS cart prices in Tooman' : 'FAIL cart prices')
  console.log('JS errors:', errs.length ? errs.slice(0, 5).join(' | ') : 'none')

  // Also check the products page card prices
  await page.goto(`http://localhost:${fePort}/products`, { waitUntil: 'domcontentloaded' })
  await sleep(1200)
  const prods = await page.evaluate(() => ({
    cardPrices: Array.from(document.querySelectorAll('.product-card .price')).map(e => e.textContent.trim()),
    bodyHasDollar: document.body.innerText.includes('$')
  }))
  console.log('product cards:', JSON.stringify(prods))
  const prodsOk = prods.cardPrices.length > 0 && prods.cardPrices.every(p => /Tooman|تومان/.test(p)) && !prods.bodyHasDollar
  console.log(prodsOk ? 'PASS product cards in Tooman' : 'FAIL product cards')

  await browser.close()
  if (!(apiUp && feUp && ok && prodsOk && errs.length === 0)) { console.log('FAIL'); process.exit(1) }
  console.log('ALL CART/PRICE CHECKS PASS')
} finally {
  try { spawn('taskkill', ['/F', '/PID', String(backend.pid), '/T'], { stdio: 'ignore', shell: true }) } catch {}
  try { spawn('taskkill', ['/F', '/PID', String(fe.pid), '/T'], { stdio: 'ignore', shell: true }) } catch {}
}