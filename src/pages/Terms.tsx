import { useTranslation } from '@/context/LanguageContext'

export default function Terms() {
  const { t } = useTranslation()
  const sections: { h: string; p: string }[] = t('terms.sections')

  return (
    <div className="section max-w-3xl py-14">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('terms.title')}</h1>
      <p className="mt-2 text-sm text-gray-400">{t('terms.updated')}</p>

      <div className="mt-8 space-y-6 text-gray-700 dark:text-gray-300">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{s.h}</h2>
            <p className="mt-2 text-sm leading-relaxed">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
