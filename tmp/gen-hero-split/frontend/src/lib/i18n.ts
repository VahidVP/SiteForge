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
}

export function initLang(primary: Lang): void {
  if (!site.bilingual) {
    apply(primary)
    return
  }
  const saved = localStorage.getItem('site_lang')
  if (saved === 'en' || saved === 'fa') {
    apply(saved)
    return
  }
  apply(primary)
}

export function setLang(lang: Lang): void {
  if (!site.bilingual) return
  apply(lang)
  localStorage.setItem('site_lang', lang)
}

export function t(key: string): string {
  return dicts[current][key] ?? dicts.en[key] ?? key
}
