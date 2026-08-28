import { chromium } from 'playwright-core'

const ORIGIN = process.env.ORIGIN || 'http://localhost:5173'
const CODE = process.env.CODE || 'demo1234'

const results = []
function check(name, ok, extra = '') {
  results.push({ name, ok, extra })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`)
}

async function logErrors(page, name) {
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(ORIGIN + name, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  return errors
}

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage()

// 1. home renders, no owner/admin link in nav or footer
{
  const errs = []
  page.on('pageerror', e => errs.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  check('home renders', (await page.evaluate(() => document.body.innerText.trim().length)) > 40, `errs=${errs.length}`)
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a')).map(a => (a.textContent || '').trim().toLowerCase())
  )
  check('no owner/admin link in nav/footer', !links.some(l => /admin|owner|داشبورد|پنل/.test(l)), JSON.stringify(links.slice(0, 12)))
}

// 2. /admin shows the owner gate when no token
{
  await page.goto(ORIGIN + '/admin', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const gateVisible = await page.evaluate(() => document.body.innerText.includes('website owner only'))
  const gateBtn = await page.evaluate(() => Array.from(document.querySelectorAll('a,button')).some(el => (el.textContent || '').includes('Enter')))
  check('admin gate shown without token', gateVisible && gateBtn)
  const gateLink = await page.evaluate(() => Array.from(document.querySelectorAll('a')).some(a => (a.getAttribute('href') || '').includes('/owner')))
  check('gate links to /owner', gateLink)
}

// 3. wrong owner code -> error
{
  await page.goto(ORIGIN + '/owner', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const input = page.locator('input').first()
  await input.fill('wrong-code-123')
  await page.locator('button[type="submit"], button').first().click()
  await page.waitForTimeout(1200)
  const urlAfter = page.url()
  const errShown = await page.evaluate(() => document.body.innerText)
  check('wrong code stays on /owner', urlAfter.includes('/owner'), urlAfter)
  check('wrong code shows error', /invalid|wrong|incorrect|error|not/i.test(errShown))
}

// 4. correct owner code -> /admin console
{
  const input = page.locator('input').first()
  await input.fill(CODE)
  await page.locator('button[type="submit"], button').first().click()
  await page.waitForTimeout(1800)
  const urlAfter = page.url()
  check('correct code redirects to /admin', urlAfter.includes('/admin'), urlAfter)
  const consoleText = await page.evaluate(() => document.body.innerText)
  check('admin console visible', consoleText.length > 40, consoleText.slice(0, 120).replace(/\n/g, ' '))
  // token stored
  const tok = await page.evaluate(() => localStorage.getItem('owner_token'))
  check('owner_token stored in localStorage', !!tok && tok.length > 0)
}

// 5. services page renders API data (3 seeded services)
{
  await page.goto(ORIGIN + '/services', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const serviceCards = await page.evaluate(() => document.querySelectorAll('a[href^="/services/"], article, .card').length)
  const text = await page.evaluate(() => document.body.innerText)
  check('services page has API content', text.length > 60, `cards=${serviceCards}`)
  check('services page shows a seeded name', /Website Design|Marketing|Web Development|services/i.test(text))
}

// 6. services/:id detail page renders
{
  await page.goto(ORIGIN + '/services/1', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const text = await page.evaluate(() => document.body.innerText)
  const urlOk = page.url().includes('/services/1')
  check('service detail renders', urlOk && text.length > 40)
  check('service detail has content', text.length > 100, text.slice(0, 100).replace(/\n/g, ' '))
}

await browser.close()
const failed = results.filter(r => !r.ok)
console.log(`\n===== E2E SUMMARY =====`)
console.log(`${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)