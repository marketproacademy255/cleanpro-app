import { useTranslation } from '@/context/LanguageContext'
import { COMPANY_EMAIL } from '@/lib/config'

export default function Privacy() {
  const { t } = useTranslation()
  const sections: { h: string; p: string }[] = t('privacy.sections')

  return (
    <div className="section max-w-3xl py-14">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('privacy.title')}</h1>
      <p className="mt-2 text-sm text-gray-400">{t('privacy.updated')}</p>

      <div className="mt-8 space-y-6 text-gray-700 dark:text-gray-300">
        {sections.map((s) => {
          const parts = s.p.split('{email}')
          return (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{s.h}</h2>
              <p className="mt-2 text-sm leading-relaxed">
                {parts.length === 2 ? (
                  <>
                    {parts[0]}
                    <a href={`mailto:${COMPANY_EMAIL}`} className="text-brand-700 hover:underline dark:text-brand-400">
                      {COMPANY_EMAIL}
                    </a>
                    {parts[1]}
                  </>
                ) : (
                  s.p
                )}
              </p>
            </section>
          )
        })}
      </div>
    </div>
  )
}
