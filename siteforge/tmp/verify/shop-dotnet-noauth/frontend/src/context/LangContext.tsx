import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { getLang, setLang as persistLang, t as translate } from '../lib/i18n'
import { site } from '../lib/site'

interface I18n {
  lang: 'en' | 'fa'
  t: (key: string) => string
  switchTo: (lang: 'en' | 'fa') => void
}

const LangContext = createContext<I18n>({ lang: getLang(), t: translate, switchTo: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(getLang())

  const value = useMemo<I18n>(
    () => ({
      lang,
      t: translate,
      switchTo(next) {
        if (!site.bilingual) return
        persistLang(next)
        setLangState(next)
      }
    }),
    [lang]
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useI18n(): I18n {
  return useContext(LangContext)
}
