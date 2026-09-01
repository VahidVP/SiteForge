import { chromium } from 'playwright-core'
import { setTimeout as sleep } from 'node:timers/promises'

let pass = 0, fail = 0
const check = (name, ok, detail = '') => { if (ok) { pass++; console.log(`  ok  ${name}`) } else { fail++; console.log(`FAIL  ${name} ${detail}`) } }

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1000 } })
const errs = []
page.on('pageerror', e => errs.push(String(e)))
await page.goto('http://localhost:5191/', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.hero', { timeout: 60000 })
await sleep(1200)

const fa = await page.evaluate(() => {
  const hero = document.querySelector('.hero')
  const waves = hero.querySelector('.waves')
  return {
    dir: document.documentElement.dir,
    h1: hero.querySelector('h1')?.textContent,
    tagline: hero.querySelector('.tagline')?.textContent,
    heroWidth: Math.round(hero.getBoundingClientRect().width),
    bodyWidth: document.body.clientWidth,
    wavesWidth: waves ? Math.round(waves.getBoundingClientRect().width) : null,
    inContainer: Boolean(hero.closest('.container')),
    glowBlobs: hero.querySelectorAll('.hero-glow').length,
    waveCount: hero.querySelectorAll('.wave').length
  }
})
console.log('fa state:', JSON.stringify(fa, null, 1))
check('initial language is Farsi (rtl)', fa.dir === 'rtl')
check('Farsi title in hero', fa.h1 === 'برند فارسی', fa.h1)
check('Farsi tagline in hero', fa.tagline === 'شعار فارسی اینجا', fa.tagline)
check('hero is full-bleed (no .container ancestor)', !fa.inContainer)
check('hero spans full viewport width', fa.heroWidth === fa.bodyWidth, `${fa.heroWidth} vs ${fa.bodyWidth}`)
check('waves span full viewport width', fa.wavesWidth === fa.bodyWidth, `${fa.wavesWidth} vs ${fa.bodyWidth}`)
check('no glow blobs on waves hero (aurora off)', fa.glowBlobs === 0, String(fa.glowBlobs))
check('3 waves render', fa.waveCount === 3, String(fa.waveCount))

await page.click('.lang-toggle')
await sleep(800)
const en = await page.evaluate(() => {
  const hero = document.querySelector('.hero')
  return {
    dir: document.documentElement.dir,
    h1: hero.querySelector('h1')?.textContent,
    tagline: hero.querySelector('.tagline')?.textContent,
    navBrand: document.querySelector('.brand')?.textContent?.trim()
  }
})
console.log('en state:', JSON.stringify(en, null, 1))
check('switched to English (ltr)', en.dir === 'ltr')
check('English title in hero', en.h1 === 'EN Brand Name', en.h1)
check('English tagline in hero', en.tagline === 'English tagline here', en.tagline)
check('nav brand is English too', en.navBrand === 'EN Brand Name', en.navBrand)

// switch back to Farsi
await page.click('.lang-toggle')
await sleep(800)
const back = await page.evaluate(() => document.querySelector('.hero .tagline')?.textContent)
check('switch back to Farsi tagline', back === 'شعار فارسی اینجا', back)

// persistence: switch to English, reload — the saved language is keyed per site
// so it survives reload but can't bleed into a different generated site.
await page.click('.lang-toggle')
await sleep(800)
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.hero', { timeout: 60000 })
await sleep(1000)
const persisted = await page.evaluate(() => ({
  dir: document.documentElement.dir,
  h1: document.querySelector('.hero h1')?.textContent,
  keys: Object.keys(localStorage).filter(k => k.startsWith('site_lang'))
}))
check('saved language persists across reload', persisted.dir === 'ltr' && persisted.h1 === 'EN Brand Name', JSON.stringify(persisted))
check(
  'language key is per-site, not shared',
  persisted.keys.length === 1 && persisted.keys[0] === 'site_lang:EN Brand Name',
  JSON.stringify(persisted.keys)
)

check('no page errors', errs.length === 0, errs.join(' | '))
await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)