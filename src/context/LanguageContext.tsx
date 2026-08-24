import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import translations, { type Lang } from '@/i18n/translations'

const STORAGE_KEY = 'primestandard_lang'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'uz'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'uz' || stored === 'en' || stored === 'ru') return stored
  return 'uz'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    window.localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  function setLang(next: Lang) {
    setLangState(next)
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage LanguageProvider ichida chaqirilishi kerak.')
  return ctx
}

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Returns a `t()` function scoped to the current language. Looks up a
 * dot-path (e.g. "home.heroTitle") in the active dictionary, falling back
 * to Uzbek and then the key itself if nothing is found - so a missing
 * translation renders as a visible (if ugly) key instead of a crash.
 *
 * `t()` is intentionally loosely typed (`any`): most values are strings,
 * but some paths (FAQ lists, steps, service tiles, ...) are arrays/objects
 * and callers use them directly.
 */
export function useTranslation() {
  const { lang } = useLanguage()

  function t(key: string): any {
    const value = getPath(translations[lang], key)
    if (value !== undefined) return value
    const fallback = getPath(translations.uz, key)
    return fallback !== undefined ? fallback : key
  }

  return { t, lang }
}
