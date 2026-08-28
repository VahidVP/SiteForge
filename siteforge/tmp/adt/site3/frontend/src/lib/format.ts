import type { Lang } from './i18n'
import { getLang } from './i18n'

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFaDigits(value: string): string {
  return value.replace(/\d/g, d => FA_DIGITS[Number(d)])
}

export function formatNumber(value: number | string, lang?: Lang): string {
  const str = String(value)
  return (lang ?? getLang()) === 'fa' ? toFaDigits(str) : str
}

export function formatPrice(value: number | string, lang?: Lang): string {
  const l = lang ?? getLang()
  const amount = Number(value)
  if (l === 'fa') {
    return `${toFaDigits(amount.toLocaleString('en-US'))} تومان`
  }
  return `${amount.toLocaleString('en-US')} Tooman`
}

export function formatDate(value: string | undefined | null, lang?: Lang): string {
  if (!value) return ''
  const l = lang ?? getLang()
  const raw = value.slice(0, 10)
  return l === 'fa' ? toFaDigits(raw) : raw
}
