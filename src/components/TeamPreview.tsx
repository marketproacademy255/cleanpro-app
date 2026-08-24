import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StarRating from '@/components/StarRating'
import { fetchActiveCleaners } from '@/lib/publicData'
import type { Cleaner } from '@/lib/types'
import { useTranslation } from '@/context/LanguageContext'

/**
 * Shows a handful of real, active cleaners (name, rating, experience) from
 * Firestore - the same data source as the full team list on the Services
 * page. If there's no backend configured or no active cleaners yet, this
 * renders nothing rather than showing placeholder/fake staff.
 */
export default function TeamPreview() {
  const { t } = useTranslation()
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveCleaners()
      .then((list) => setCleaners([...list].sort((a, b) => b.rating - a.rating).slice(0, 4)))
      .finally(() => setLoading(false))
  }, [])

  if (loading || cleaners.length === 0) return null

  return (
    <section className="bg-gray-50 py-16 dark:bg-[#0f1a15]">
      <div className="section">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.teamTitle')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">{t('home.teamDesc')}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cleaners.map((c) => (
            <div key={c.id} className="card text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                {c.full_name.charAt(0)}
              </div>
              <div className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{c.full_name}</div>
              <div className="mt-1 flex justify-center">
                <StarRating rating={c.rating} />
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {c.years_experience} {t('home.teamExperience')}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/xizmatlar" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
            {t('home.teamSeeAll')}
          </Link>
        </div>
      </div>
    </section>
  )
}
