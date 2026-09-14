import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { fetchActiveCleaners, fetchActiveServiceTypes } from '@/lib/publicData'
import { formatUZS } from '@/lib/pricing'
import { getServiceName } from '@/lib/i18nHelpers'
import type { BookingTier, Cleaner, ServiceType } from '@/lib/types'
import StarRating from '@/components/StarRating'
import { useTranslation } from '@/context/LanguageContext'

export default function Services() {
  const { t, lang } = useTranslation()
  const tierLabels = t('pricing.tierLabels') as Record<BookingTier, string>
  const tierPerks = t('pricing.tierPerks') as Record<BookingTier, string[]>
  const [services, setServices] = useState<ServiceType[]>([
    {
      id: 'demo-1',
      code: 'std',
      name_uz: 'Standart tozalash',
      name_ru: 'Стандартная уборка',
      name_en: 'Standard Cleaning',
      description_uz: 'Uyni muntazam toza saqlash uchun standart tozalash xizmati.',
      description_ru: 'Стандартная уборка для поддержания чистоты дома.',
      property_type: 'home',
      pricing_unit: 'per_room',
      base_price: 150000,
      extra_unit_price: 40000,
      min_price: 150000,
      multiplier: 1,
      is_active: true,
      sort_order: 1,
      category: 'cleaning',
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      code: 'deep',
      name_uz: 'Chuqur tozalash',
      name_ru: 'Генеральная уборка',
      name_en: 'Deep Cleaning',
      description_uz: 'Har bir burchakni ehtiyotkorlik bilan tozalaydigan chuqur tozalash.',
      description_ru: 'Генеральная уборка, очищающая каждый уголок.',
      property_type: 'home',
      pricing_unit: 'per_room',
      base_price: 210000,
      extra_unit_price: 56000,
      min_price: 210000,
      multiplier: 1.2,
      is_active: true,
      sort_order: 2,
      category: 'cleaning',
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-3',
      code: 'office',
      name_uz: 'Ofis tozalash',
      name_ru: 'Уборка офисов',
      name_en: 'Office Cleaning',
      description_uz: 'Ish joyingizni toza va ozoda saqlash uchun professional ofis tozalash xizmati.',
      description_ru: 'Профессиональная уборка офисов.',
      property_type: 'office',
      pricing_unit: 'per_sqm',
      base_price: 8000,
      extra_unit_price: 8000,
      min_price: 300000,
      multiplier: 1,
      is_active: true,
      sort_order: 3,
      category: 'cleaning',
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-4',
      code: 'window_cleaning',
      name_uz: 'Deraza va oynalarni yuvish',
      name_ru: 'Мойка окон',
      name_en: 'Window Cleaning',
      description_uz: 'Oyna va derazalarni ichki hamda tashqi tomondan professional tozalash.',
      description_ru: 'Профессиональная мойка окон и витражей.',
      property_type: 'home',
      pricing_unit: 'per_sqm',
      base_price: 0,
      extra_unit_price: 15000,
      min_price: 150000,
      multiplier: 1,
      is_active: true,
      sort_order: 4,
      category: 'cleaning',
      created_at: new Date().toISOString()
    }
  ])
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [svc, staff] = await Promise.all([fetchActiveServiceTypes(), fetchActiveCleaners()])
        if (svc.length > 0) {
          // Filter out any leftover repair services from DB
          setServices(svc.filter((s) => (s.category ?? 'cleaning') === 'cleaning'))
        }
        setCleaners(staff)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div className="section pt-6">
        <div className="relative h-56 sm:h-72 w-full overflow-hidden rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
          <img
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1800&q=80"
            alt="Professional tozalash xizmati"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-900/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h1 className="text-2xl font-extrabold sm:text-4xl">{t('services.heroTitle')}</h1>
            <p className="mt-2 max-w-xl text-xs sm:text-sm text-white/90">{t('services.heroDesc')}</p>
          </div>
        </div>
      </div>

      <div className="section py-10">
        {loading ? (
          <div className="mt-6 text-gray-400">{t('services.loading')}</div>
        ) : error ? (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {services.map((s) => (
                <div key={s.id} className="card">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{getServiceName(s, lang)}</h3>
                    <span className="tag bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                      {s.property_type === 'home' ? t('services.home') : t('services.office')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{s.description_uz}</p>
                  <div className="mt-4 text-2xl font-bold text-brand-700 dark:text-brand-400">
                    {s.pricing_unit === 'per_sqm' ? `${formatUZS(s.extra_unit_price)} / m²` : formatUZS(s.base_price)}
                    {s.pricing_unit === 'per_room' && (
                      <span className="ml-1 text-sm font-normal text-gray-400">{t('services.startingPrice')}</span>
                    )}
                  </div>
                  {s.pricing_unit === 'per_room' && (
                    <div className="mt-1 text-xs text-gray-400">
                      + {formatUZS(s.extra_unit_price)} {t('services.perExtraRoom')}
                    </div>
                  )}
                  {s.pricing_unit === 'per_sqm' && (
                    <div className="mt-1 text-xs text-gray-400">
                      {t('services.min')} {formatUZS(s.min_price)}
                    </div>
                  )}
                  <Link to="/booking" className="btn-primary mt-5 w-full">
                    {t('services.bookThis')}
                  </Link>
                </div>
              ))}
            </div>

            {/* Tariff Tiers section with example pricing */}
            <div className="mt-14 rounded-2xl border border-gray-200 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-900/40 sm:p-8">
              <div className="text-center max-w-2xl mx-auto">
                <span className="tag bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  {t('services.tariffsTitle')}
                </span>
                <h2 className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-3xl">
                  {t('services.tariffsTitle')}
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('services.tariffsDesc')}
                </p>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {/* Standart Tariff */}
                <div className="card flex flex-col justify-between border-gray-200 shadow-sm dark:border-gray-800">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{tierLabels.standard}</h3>
                      <span className="tag bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">1.0x</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{t('services.example1Room')}</span>
                      <div className="text-3xl font-extrabold text-brand-700 dark:text-brand-400">{formatUZS(150000)}</div>
                    </div>
                    <ul className="mt-6 space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                      {tierPerks.standard.map((perk) => (
                        <li key={perk} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link to="/booking" className="btn-primary mt-6 w-full py-2.5 text-center text-sm font-semibold">
                    {t('services.bookThis')}
                  </Link>
                </div>

                {/* Premium Tariff */}
                <div className="card relative flex flex-col justify-between border-brand-500 ring-2 ring-brand-500/20 shadow-md dark:border-brand-600">
                  <span className="absolute -top-3 right-4 rounded-full bg-brand-600 px-3 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                    Popular
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{tierLabels.premium}</h3>
                      <span className="tag bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">+30%</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{t('services.example1Room')}</span>
                      <div className="text-3xl font-extrabold text-brand-700 dark:text-brand-400">{formatUZS(195000)}</div>
                    </div>
                    <ul className="mt-6 space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                      {tierPerks.premium.map((perk) => (
                        <li key={perk} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link to="/booking" className="btn-primary mt-6 w-full py-2.5 text-center text-sm font-semibold">
                    {t('services.bookThis')}
                  </Link>
                </div>

                {/* Elite Tariff */}
                <div className="card flex flex-col justify-between border-amber-200 bg-amber-50/20 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{tierLabels.elite}</h3>
                      <span className="tag bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">+65%</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{t('services.example1Room')}</span>
                      <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{formatUZS(247500)}</div>
                    </div>
                    <ul className="mt-6 space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                      {tierPerks.elite.map((perk) => (
                        <li key={perk} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link to="/booking" className="btn-primary mt-6 w-full bg-amber-600 hover:bg-amber-700 py-2.5 text-center text-sm font-semibold border-amber-600">
                    {t('services.bookThis')}
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {cleaners.length > 0 && (
          <>
            <h2 className="mt-16 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('services.teamTitle')}</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">{t('services.teamDesc')}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
              {cleaners.map((c) => (
                <div key={c.id} className="card text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                    {c.full_name.charAt(0)}
                  </div>
                  <div className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{c.full_name}</div>
                  <div className="mt-1 flex justify-center"><StarRating rating={c.rating} /></div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {c.years_experience} {t('services.yearsExperience')}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
