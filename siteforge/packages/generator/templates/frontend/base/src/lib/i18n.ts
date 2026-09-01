export type Lang = 'en' | 'fa'

type Dict = Record<string, string>

import { en, fa } from './dictionaries'
import { site } from './site'

const dicts: Record<Lang, Dict> = { en, fa }

let current: Lang = 'en'

export function getLang(): Lang {
  return current
}

function apply(lang: Lang) {
  current = lang
  document.body.dataset.lang = lang
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
  // keep <body> in sync: a stale hardcoded dir attribute on <body> would
  // override the html-level direction and keep the whole layout stick in RTL.
  document.body.dir = lang === 'fa' ? 'rtl' : ''
}

// The saved visitor language is keyed per site (by site title) so that different
// generated sites opened on the same dev port (localhost:5173) don't leak language
// state into each other — a Farsi-primary site must not open in English (or vice
// versa) just because a previously generated site was last viewed in English.
function langKey(): string {
  return `site_lang:${site.title || 'default'}`
}

export function initLang(primary: Lang): void {
  if (!site.bilingual) {
    apply(primary)
    return
  }
  const saved = localStorage.getItem(langKey())
  if (saved === 'en' || saved === 'fa') {
    apply(saved)
    return
  }
  apply(primary)
}

export function setLang(lang: Lang): void {
  if (!site.bilingual) return
  apply(lang)
  localStorage.setItem(langKey(), lang)
}

export function t(key: string): string {
  return dicts[current][key] ?? dicts.en[key] ?? key
}
