import { CheckCircle2, CreditCard, Leaf, ShieldCheck } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

const PILLAR_ICONS = [ShieldCheck, CreditCard, Leaf]

export default function About() {
  const { t } = useTranslation()
  const pillars: { title: string; desc: string }[] = t('about.pillars')
  const reasons: string[] = t('about.reasons')

  return (
    <div className="section max-w-3xl py-14">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('about.title')}</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">{t('about.intro')}</p>

      <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        <img
          src="https://images.unsplash.com/photo-1713110824336-f78c320dcf8e?auto=format&fit=crop&w=1200&q=80"
          alt="Xizmatchi mebelni tozalamoqda"
          className="h-64 w-full object-cover sm:h-80"
          loading="lazy"
        />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {pillars.map((p, i) => {
          const Icon = PILLAR_ICONS[i] ?? ShieldCheck
          return (
            <div key={p.title} className="card text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                <Icon className="h-6 w-6" />
              </span>
              <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{p.title}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{p.desc}</div>
            </div>
          )
        })}
      </div>

      <h2 className="mt-12 text-xl font-bold text-gray-900 dark:text-gray-100">{t('about.whyTitle')}</h2>
      <ul className="mt-4 space-y-3 text-gray-600 dark:text-gray-300">
        {reasons.map((r) => (
          <li key={r} className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  )
}
