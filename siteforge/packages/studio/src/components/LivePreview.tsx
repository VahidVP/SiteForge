import { useMemo, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import type {
  Catalog,
  FooterStyle,
  HeaderStyle,
  HeroStyle,
  Language,
  LogoMode,
  SiteType,
  TemplateId
} from '@siteforge/shared'

export interface LivePreviewProps {
  catalog: Catalog
  siteType: SiteType | null
  template: TemplateId
  language: Language
  bilingual: boolean
  headerStyle: HeaderStyle
  footerStyle: FooterStyle
  heroStyle: HeroStyle
  heroImage: string | null
  modules: string[]
  uiModules: string[]
  title: string
  tagline: string
  titleFa: string
  taglineFa: string
  logo: string | null
  logoMode: LogoMode
  eyebrow: string
  hint: string
}

/* ————— color helpers ————— */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function mix(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  return toHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])
}

function luminance(hex: string): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const [r, g, b] = hexToRgb(hex).map(v => lin(v / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export interface PreviewTheme {
  bg: string
  fg: string
  surface: string
  border: string
  muted: string
  accent: string
  accent2: string
  onAccent: string
  fontHead: string
  fontBody: string
  dark: boolean
}

export function deriveTheme(template: TemplateId, catalog: Catalog): PreviewTheme {
  const tpl = catalog.templates.find(t => t.id === template) ?? catalog.templates[0]

  // Preferred path: the exact palette shipped in the generator registry — the same
  // data the generated site's themes.css is rendered from, so preview == real site.
  const th = tpl.theme
  if (th) {
    return {
      bg: th.bg,
      fg: th.text,
      surface: th.surface,
      border: th.border,
      muted: th.muted,
      accent: th.accent,
      accent2: th.accent2,
      onAccent: th.accentContrast,
      fontHead: th.fontHead,
      fontBody: th.fontBody,
      dark: luminance(th.bg) < 0.5
    }
  }

  // Fallback for catalogs without theme data: derive from the swatches.
  const bg = tpl.swatchBg
  const accent = tpl.swatchAccent
  const dark = luminance(bg) < 0.5
  const fg = dark ? '#eef2ff' : '#141b2c'
  const surface = mix(bg, fg, dark ? 0.07 : 0.05)
  const border = mix(bg, fg, dark ? 0.18 : 0.14)
  const muted = mix(bg, fg, dark ? 0.45 : 0.4)
  const accent2 = mix(accent, '#9fe8ff', dark ? 0.45 : 0.35)
  const onAccent = luminance(accent) > 0.55 ? '#14121f' : '#ffffff'
  const fontHead = 'system-ui, sans-serif'
  const fontBody = 'system-ui, sans-serif'
  return { bg, fg, surface, border, muted, accent, accent2, onAccent, fontHead, fontBody, dark }
}

/* ————— content data ————— */

type NavKey = 'home' | 'about' | 'portfolio' | 'services' | 'products' | 'cart' | 'account' | 'contact'

const NAV_TXT: Record<Language, Record<NavKey, string>> = {
  en: {
    home: 'Home', about: 'About', portfolio: 'Projects', services: 'Services',
    products: 'Products', cart: 'Cart', account: 'Account', contact: 'Contact'
  },
  fa: {
    home: 'خانه', about: 'درباره', portfolio: 'نمونهکارها', services: 'خدمات',
    products: 'محصولات', cart: 'سبد', account: 'حساب', contact: 'تماس'
  }
}

function navFor(siteType: SiteType | null, modules: string[]): NavKey[] {
  const keys: NavKey[] = ['home']
  if (siteType === 'shop') {
    if (modules.includes('shop-catalog')) keys.push('products', 'cart')
    if (modules.includes('auth')) keys.push('account')
  } else if (siteType === 'personal') {
    keys.push('about', 'portfolio')
  } else if (siteType === 'business') {
    keys.push('about', 'services')
  }
  if (!siteType && modules.includes('auth')) keys.push('account')
  if (modules.includes('contact-form')) keys.push('contact')
  if (siteType !== 'shop' && modules.includes('auth')) keys.push('account')
  return keys.slice(0, 5)
}

const SECTION_HEADING: Record<SiteType, Record<Language, string>> = {
  personal: { en: 'Recent work', fa: 'نمونهکارهای اخیر' },
  business: { en: 'What we do', fa: 'خدمات ما' },
  shop: { en: 'Featured products', fa: 'محصولات برگزیده' }
}

const PRODUCT_NAMES: Record<Language, string[]> = {
  en: ['Aurora Lamp', 'Field Coat', 'Frost Watch', 'Nimbus Bag'],
  fa: ['چراغ آرورا', 'کاپشن میدانی', 'ساعت فراست', 'کیف نیمبوس']
}

const PRODUCT_PRICES: Record<Language, string[]> = {
  en: ['$84', '$129', '$95', '$72'],
  fa: ['۲٫۴ میلیون', '۳٫۵ میلیون', '۲٫۶ میلیون', '۲ میلیون']
}

const MARQUEE_WORDS: Record<Language, string[]> = {
  en: ['Quality work', 'Fast delivery', 'Fair prices', 'Free support'],
  fa: ['کیفیت بالا', 'ارسال سریع', 'قیمت منصفانه', 'پشتیبانی رایگان']
}

const FOOTER_GROUPS_LABEL: Record<Language, string[]> = {
  en: ['Explore', 'Account'],
  fa: ['کاوش', 'حساب']
}

/* ————— main component ————— */

export function LivePreview(props: LivePreviewProps) {
  const theme = useMemo(() => deriveTheme(props.template, props.catalog), [props.template, props.catalog])
  const lang = props.language

  const brandTitle = (lang === 'fa' ? (props.titleFa.trim() || props.title) : props.title).trim() || (lang === 'fa' ? 'وبسایت من' : 'My Website')
  const tagline =
    (lang === 'fa' ? (props.taglineFa.trim() || props.tagline) : props.tagline).trim() || undefined

  const cssVars = {
    '--p-bg': theme.bg,
    '--p-fg': theme.fg,
    '--p-surface': theme.surface,
    '--p-border': theme.border,
    '--p-muted': theme.muted,
    '--p-accent': theme.accent,
    '--p-accent2': theme.accent2,
    '--p-on-accent': theme.onAccent,
    '--p-font-head': theme.fontHead,
    '--p-font-body': theme.fontBody
  } as CSSProperties

  return (
    <div className="pv">
      <div className="pv-head">
        <span className="pv-eyebrow">{props.eyebrow}</span>
        <span className="pv-hint">{props.hint}</span>
      </div>
      <div
        className="browser"
        dir={lang === 'fa' ? 'rtl' : 'ltr'}
        style={{
          ...cssVars as CSSProperties,
          direction: lang === 'fa' ? 'rtl' : undefined,
          fontFamily: lang === 'fa' ? 'Vazirmatn, Segoe UI, system-ui, sans-serif' : theme.fontBody
        }}
      >
        <div className="browser-chrome">
          <span className="browser-dot browser-dot-r" />
          <span className="browser-dot browser-dot-y" />
          <span className="browser-dot browser-dot-g" />
          <span className="browser-url">{lang === 'fa' ? 'وبسایت‌های من' : 'build.siteforge.dev'}</span>
        </div>
        <div className="page">
          <PreviewNav headline={brandTitle} siteType={props.siteType} modules={props.modules} language={lang} bilingual={props.bilingual} headerStyle={props.headerStyle} logo={props.logo} logoMode={props.logoMode} />
          <PreviewHero heroStyle={props.heroStyle} heroImage={props.heroImage} uiModules={props.uiModules} language={lang} title={brandTitle} tagline={tagline} />
          {props.uiModules.includes('anim.marquee') ? <PreviewMarquee language={lang} /> : null}
          <PreviewSection siteType={props.siteType} uiModules={props.uiModules} language={lang} />
          <PreviewFooter footerStyle={props.footerStyle} language={lang} title={brandTitle} tagline={tagline} />
        </div>
      </div>
    </div>
  )
}

/* ————— navbar ————— */

function brandMark(title: string, logo: string | null, logoMode: LogoMode) {
  const showImg = Boolean(logo) && (logoMode === 'image' || logoMode === 'both')
  const showTxt = logoMode !== 'image'
  return (
    <span className="pv-brand">
      {showImg ? <img className="pv-logo" src={logo ?? undefined} alt="" /> : null}
      {showTxt ? <b className="pv-brand-name">{title}</b> : null}
    </span>
  )
}

function PreviewNav({
  headline, siteType, modules, language, bilingual, headerStyle, logo, logoMode
}: {
  headline: string
  siteType: SiteType | null
  modules: string[]
  language: Language
  bilingual: boolean
  headerStyle: HeaderStyle
  logo: string | null
  logoMode: LogoMode
}) {
  const txt = NAV_TXT[language]
  const links = navFor(siteType, modules)
  const modifier = `pv-nav--${headerStyle}`
  return (
    <div className={`pv-nav ${modifier}`}>
      {brandMark(headline, logo, logoMode)}
      <span className="pv-links">
        {links.map(k => (
          <span className="pv-link" key={k}>{txt[k]}</span>
        ))}
      </span>
      <span className="pv-end">
        {bilingual ? <span className="pv-chip">{language === 'en' ? 'EN / فا' : 'فا / EN'}</span> : null}
        <span className="pv-pill">{language === 'fa' ? 'شروع' : 'Start'}</span>
      </span>
    </div>
  )
}

/* ————— hero ————— */

function CascadingTitle({ title, cascade }: { title: string; cascade: boolean }) {
  const words = title.trim().split(/\s+/)
  if (!cascade || words.length < 2) return <span className="pv-title">{title}</span>
  return (
    <span className="pv-title word-cascade" key={title}>
      {words.map((w, i) => (
        <span className="word" key={`${title}-${i}`} style={{ animationDelay: `${i * 80}ms` }}>{w}</span>
      ))}
    </span>
  )
}

function SpotlightHero({ title, tagline, cascade, language }: {
  title: string
  tagline?: string
  cascade: boolean
  language: Language
}) {
  const [spot, setSpot] = useState({ x: 65, y: 40 })
  function move(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    setSpot({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }
  return (
    <div className="pv-hero pv-hero--spot" onMouseMove={move} style={{ background: `radial-gradient(96px circle at ${spot.x}% ${spot.y}%, color-mix(in srgb, var(--p-accent) 36%, transparent), transparent 72%)` }}>
      <div className="pv-hero-copy">
        <CascadingTitle title={title} cascade={cascade} />
        {tagline ? <span className="pv-tagline">{tagline}</span> : null}
        <span className="pv-pill">{language === 'fa' ? 'شروع کن' : 'Get started'}</span>
      </div>
    </div>
  )
}

function heroCopy(title: string, tagline: string | undefined, cascade: boolean, language: Language) {
  return (
    <div className="pv-hero-copy">
      <CascadingTitle title={title} cascade={cascade} />
      {tagline ? <span className="pv-tagline">{tagline}</span> : null}
      <span className="pv-pill">{language === 'fa' ? 'شروع کن' : 'Get started'}</span>
    </div>
  )
}

function PreviewHero({ heroStyle, heroImage, uiModules, language, title, tagline }: {
  heroStyle: HeroStyle
  heroImage: string | null
  uiModules: string[]
  language: Language
  title: string
  tagline?: string
}) {
  const cascade = uiModules.includes('anim.text-reveal')
  const aurora = uiModules.includes('anim.aurora')
  const aura = aurora ? (
    <span className="pv-aurora">
      <span className="pv-aurora-a" />
      <span className="pv-aurora-b" />
    </span>
  ) : null

  switch (heroStyle) {
    case 'split':
      return (
        <div className="pv-hero pv-hero--split">
          {aura}
          <div className="pv-hero-copy">
            <CascadingTitle title={title} cascade={cascade} />
            {tagline ? <span className="pv-tagline">{tagline}</span> : null}
            <span className="pv-pill">{language === 'fa' ? 'شروع کن' : 'Get started'}</span>
          </div>
          <span className={'pv-art' + (heroImage ? '' : ' pv-art--plain')}>
            <span className="pv-art-orb pv-art-orb-a" />
            <span className="pv-art-orb pv-art-orb-b" />
            {heroImage ? <img className="pv-art-img" src={heroImage} alt="" /> : null}
          </span>
        </div>
      )
    case 'spotlight':
      return <SpotlightHero title={title} tagline={tagline} cascade={cascade} language={language} />
    case 'waves':
      return (
        <div className="pv-hero pv-hero--waves">
          {aura}
          <span className="pv-wave pv-wave-a" />
          <span className="pv-wave pv-wave-b" />
          {heroCopy(title, tagline, cascade, language)}
        </div>
      )
    case 'grid':
      return (
        <div className="pv-hero pv-hero--grid">
          {aura}
          <span className="pv-floor" />
          {heroCopy(title, tagline, cascade, language)}
        </div>
      )
    default:
      return (
        <div className="pv-hero pv-hero--glow">
          {aura}
          <span className="pv-blob pv-blob-a" />
          <span className="pv-blob pv-blob-b" />
          {heroCopy(title, tagline, cascade, language)}
        </div>
      )
  }
}

/* ————— marquee ————— */

function PreviewMarquee({ language }: { language: Language }) {
  const words = MARQUEE_WORDS[language]
  return (
    <div className="marquee-strip pv-marquee">
      <div className="marquee-track">
        {[...Array(2)].flatMap((_, r) =>
          words.map((w, i) => (
            <span key={`${r}-${i}`} className="marquee-item" style={{ fontSize: '.62rem', letterSpacing: '1px', color: 'var(--p-accent)' }}>{w} ✦</span>
          ))
        )}
      </div>
    </div>
  )
}

/* ————— content section ————— */

function PreviewSection({ siteType, uiModules, language }: {
  siteType: SiteType | null
  uiModules: string[]
  language: Language
}) {
  const shop = siteType === 'shop'
  const lift = uiModules.includes('anim.hover-lift')
  const heading = SECTION_HEADING[siteType ?? 'personal'][language]
  const count = shop ? 4 : 3
  const names = PRODUCT_NAMES[language]
  const prices = PRODUCT_PRICES[language]
  return (
    <div className="pv-section">
      <span className="pv-section-label">{heading}</span>
      <div className={shop ? 'pv-cards pv-cards--shop' : 'pv-cards'}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={lift ? 'pv-card pv-card--lift' : 'pv-card'} style={{ animationDelay: `${i * 90}ms` }}>
            {shop ? (
              <>
                <span className="pv-thumb" />
                <b className="pv-name">{names[i]}</b>
                <span className="pv-price">{prices[i]}</span>
              </>
            ) : (
              <>
                <b className="pv-line" />
                <i className="pv-sub" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ————— footer ————— */

function FooterGroups({ language }: { language: Language }) {
  const [explore, account] = FOOTER_GROUPS_LABEL[language]
  const txt = NAV_TXT[language]
  return (
    <div className="pv-fcols">
      <div className="pv-fcol">
        <span className="pv-fbyl">{explore}</span>
        <span className="pv-flink">{txt.home}</span>
        <span className="pv-flink">{txt.about}</span>
        <span className="pv-flink">{txt.contact}</span>
      </div>
      <div className="pv-fcol">
        <span className="pv-fbyl">{account}</span>
        <span className="pv-flink">{language === 'fa' ? 'ورود' : 'Sign in'}</span>
        <span className="pv-flink">{language === 'fa' ? 'ثبتنام' : 'Register'}</span>
      </div>
    </div>
  )
}

function previewFooterContent({ footerStyle, language, title, tagline }: {
  footerStyle: FooterStyle
  language: Language
  title: string
  tagline?: string
}) {
  const brand = (
    <>
      <b className="pv-fbrand">{title}</b>
      {tagline ? <span className="pv-muted">{tagline}</span> : null}
    </>
  )
  const copy = <span className="pv-muted pv-copy">© 2026 {title}</span>

  switch (footerStyle) {
    case 'simple':
      return (
        <div className="pv-footer pv-footer--simple">
          <span className="pv-fcol">{brand}</span>
          <FooterGroups language={language} />
          {copy}
        </div>
      )
    case 'centered':
      return (
        <div className="pv-footer pv-footer--centered">
          <span className="pv-fcol" style={{ alignItems: 'center' }}>{brand}</span>
          <span className="pv-fcols" style={{ justifyContent: 'center' }}>
            <FooterGroups language={language} />
          </span>
          {copy}
        </div>
      )
    case 'brandmark':
      return (
        <div className="pv-footer pv-footer--brandmark">
          <b className="pv-fbrand">{title}</b>
          <span className="pv-muted">{language === 'fa' ? 'برند شما' : 'Your brand'}</span>
          <div className="pv-fcols" style={{ justifyContent: 'center' }}>
            <FooterGroups language={language} />
          </div>
        </div>
      )
    case 'split':
      return (
        <div className="pv-footer pv-footer--split">
          <span className="pv-fcol">{brand}</span>
          <FooterGroups language={language} />
          {copy}
        </div>
      )
    default:
      return (
        <div className="pv-footer pv-footer--columns">
          <span className="pv-fcol pv-fcol-brand">{brand}</span>
          <FooterGroups language={language} />
          <span className="pv-muted pv-copy" style={{ textAlign: 'end' }}>{copy}</span>
        </div>
      )
  }
}

function PreviewFooter({ footerStyle, language, title, tagline }: {
  footerStyle: FooterStyle
  language: Language
  title: string
  tagline?: string
}) {
  return <>{previewFooterContent({ footerStyle, language, title, tagline })}</>
}