import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { ar } from './ar'
import { en } from './en'

type Locale = 'ar' | 'en'
type Translations = typeof ar

const locales: Record<Locale, Translations> = { ar, en }

interface I18nContextValue {
  locale: Locale
  t: Translations
  setLocale: (l: Locale) => void
  toggleLocale: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ar')
  const t = locales[locale]

  const toggleLocale = useCallback(() => {
    setLocale((prev) => prev === 'ar' ? 'en' : 'ar')
  }, [])

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
