import { useEffect, useRef, useState } from 'react'
import { Globe } from 'lucide-react'
import { useLanguage, useTranslation } from '@/context/LanguageContext'
import { LANGUAGES } from '@/i18n/translations'

/**
 * Small dropdown language switcher (UZ / EN / RU). Persisted via
 * LanguageContext (localStorage), so the choice sticks across visits.
 */
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('nav.language')}
        title={t('nav.language')}
        className={`flex items-center gap-1.5 rounded-md border border-gray-200 text-gray-500 transition hover:border-brand-600 hover:text-brand-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400 ${
          compact ? 'h-10 px-2.5 text-xs font-semibold' : 'h-10 px-3 text-xs font-semibold'
        }`}
      >
        <Globe className="h-4 w-4" />
        {current.code.toUpperCase()}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#101c17]">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-brand-900/40 ${
                l.code === lang ? 'font-semibold text-brand-700 dark:text-brand-400' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {l.label}
              <span className="text-xs uppercase text-gray-400">{l.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
