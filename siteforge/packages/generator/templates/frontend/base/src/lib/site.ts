export interface SiteFlags {
  title: string
  tagline: string
  titleFa?: string
  taglineFa?: string
  logo?: string
  logoMode: 'text' | 'image' | 'both'
  siteType: 'personal' | 'business' | 'shop'
  template: string
  language: 'en' | 'fa'
  bilingual: boolean
  headerStyle: string
  footerStyle: string
  heroStyle: string
  heroImage?: string
  cardStyle: 'rounded' | 'soft' | 'sharp'
  contentWidth: 'cozy' | 'wide'
  ctaLabel?: string
  ctaLabelFa?: string
  cardsTitle?: string
  cardsTitleFa?: string
  isPersonal: boolean
  isBusiness: boolean
  isShop: boolean
  authScheme: 'Token' | 'Bearer'
  hasOwnerCode: boolean
  auth: boolean
  shop: boolean
  contact: boolean
  reveal: boolean
  hoverLift: boolean
  textReveal: boolean
  tilt: boolean
  magnetic: boolean
  aurora: boolean
  marquee: boolean
  float: boolean
  zoom: boolean
  shine: boolean
}

const raw = (window as unknown as { __SITE__?: Record<string, unknown> }).__SITE__ as SiteFlags & Record<string, unknown> | undefined

export const site: SiteFlags = {
  title: (raw?.title as string) ?? document.title ?? 'My Site',
  tagline: (raw?.tagline as string) ?? '',
  titleFa: (raw?.titleFa as string) ?? '',
  taglineFa: (raw?.taglineFa as string) ?? '',
  logo: (raw?.logo as string) ?? '',
  logoMode: ((raw?.logoMode as SiteFlags['logoMode']) ?? (raw?.logo ? 'both' : 'text')),
  siteType: (raw?.siteType as SiteFlags['siteType']) ?? 'personal',
  template: (raw?.template as string) ?? 'midnight',
  language: (raw?.language as 'en' | 'fa') ?? 'en',
  bilingual: (raw?.bilingual as boolean) ?? true,
  headerStyle: (raw?.headerStyle as string) ?? 'classic',
  footerStyle: (raw?.footerStyle as string) ?? 'columns',
  heroStyle: (raw?.heroStyle as string) ?? 'glow-center',
  heroImage: (raw?.heroImage as string) ?? '',
  cardStyle: ((raw?.cardStyle as string) === 'soft' || (raw?.cardStyle as string) === 'sharp' ? (raw?.cardStyle as SiteFlags['cardStyle']) : 'rounded'),
  contentWidth: ((raw?.contentWidth as string) === 'wide' ? 'wide' : 'cozy'),
  ctaLabel: (raw?.ctaLabel as string) ?? '',
  ctaLabelFa: (raw?.ctaLabelFa as string) ?? '',
  cardsTitle: (raw?.cardsTitle as string) ?? '',
  cardsTitleFa: (raw?.cardsTitleFa as string) ?? '',
  isPersonal: ((raw?.siteType as string) ?? 'personal') === 'personal',
  isBusiness: (raw?.siteType as string) === 'business',
  isShop: (raw?.siteType as string) === 'shop',
  authScheme: (raw?.authScheme as 'Token' | 'Bearer') ?? 'Bearer',
  hasOwnerCode: Boolean((raw as Record<string, unknown>)?.hasOwnerCode),
  auth: Boolean((raw as Record<string, unknown>)?.auth),
  shop: Boolean((raw as Record<string, unknown>)?.shop),
  contact: Boolean((raw as Record<string, unknown>)?.contact),
  reveal: raw ? Boolean((raw as Record<string, unknown>).reveal) : true,
  hoverLift: raw ? Boolean((raw as Record<string, unknown>).hoverLift) : true,
  textReveal: Boolean((raw as Record<string, unknown>)?.textReveal),
  tilt: Boolean((raw as Record<string, unknown>)?.tilt),
  magnetic: Boolean((raw as Record<string, unknown>)?.magnetic),
  aurora: Boolean((raw as Record<string, unknown>)?.aurora),
  marquee: Boolean((raw as Record<string, unknown>)?.marquee),
  float: Boolean((raw as Record<string, unknown>)?.float),
  zoom: Boolean((raw as Record<string, unknown>)?.zoom),
  shine: Boolean((raw as Record<string, unknown>)?.shine)
}

export function siteTitle(lang: string): string {
  if (lang === 'fa' && site.titleFa && site.titleFa.trim()) return site.titleFa
  return site.title
}

export function siteTagline(lang: string): string {
  if (lang === 'fa' && site.taglineFa && site.taglineFa.trim()) return site.taglineFa
  return site.tagline
}

/** Wizard "Website text" overrides with fallback to the per-type defaults. */
export function siteCtaLabel(lang: string, fallback: string): string {
  if (lang === 'fa' && site.ctaLabelFa && site.ctaLabelFa.trim()) return site.ctaLabelFa
  if (lang !== 'fa' && site.ctaLabel && site.ctaLabel.trim()) return site.ctaLabel
  if (site.ctaLabelFa && site.ctaLabelFa.trim()) return lang === 'fa' ? site.ctaLabelFa : (site.ctaLabel?.trim() ? site.ctaLabel : site.ctaLabelFa)
  if (site.ctaLabel && site.ctaLabel.trim()) return site.ctaLabel
  return fallback
}

export function siteCardsTitle(lang: string, fallback: string): string {
  if (lang === 'fa' && site.cardsTitleFa && site.cardsTitleFa.trim()) return site.cardsTitleFa
  if (lang !== 'fa' && site.cardsTitle && site.cardsTitle.trim()) return site.cardsTitle
  if (site.cardsTitleFa && site.cardsTitleFa.trim()) return lang === 'fa' ? site.cardsTitleFa : (site.cardsTitle?.trim() ? site.cardsTitle : site.cardsTitleFa)
  if (site.cardsTitle && site.cardsTitle.trim()) return site.cardsTitle
  return fallback
}
