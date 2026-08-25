import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CreditCard, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { getServiceName } from '@/lib/i18nHelpers'
import { fetchActiveServiceTypes } from '@/lib/publicData'
import { formatUZS } from '@/lib/pricing'
import { bookingStatusMeta } from '@/lib/bookingStatus'
import Reveal from '@/components/Reveal'
import type { Booking, ServiceType } from '@/lib/types'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'

// Same icon set as Home.tsx's trust bar (TRUST_ICONS) - reusing both the
// icons and the `home.trustPoints` copy here so a logged-in user still sees
// the same reassurance signals a first-time visitor gets, instead of the
// dashboard feeling "thinner" than the marketing site.
const TRUST_ICONS = [ShieldCheck, CreditCard, Zap, Sparkles]

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { t, lang } = useTranslation()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)

  const statusMeta = bookingStatusMeta(t)
  const trustPoints: { label: string; desc: string }[] = t('home.trustPoints')

  useEffect(() => {
    async function load() {
      if (!user) return
      const [bookingData, serviceData] = await Promise.all([
        apiFetch<Booking[]>('bookings').catch(() => []),
        fetchActiveServiceTypes().catch(() => []),
      ])
      setBookings(bookingData)
      setServices(serviceData.slice(0, 6))
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <div className="section py-14">
      <h1 className="text-3xl font-bold text-gray-900">
        {t('dashboard.greeting')}, {profile?.full_name || t('dashboard.defaultName')}
      </h1>
      <p className="mt-2 text-gray-500">{t('dashboard.subtitle')}</p>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.myBookings')}</h2>
        <Link to="/band-qilish" className="btn-primary py-2">
          {t('dashboard.newBooking')}
        </Link>
      </div>

      {loading ? (
        <div className="mt-10 text-gray-400">{t('dashboard.loading')}</div>
      ) : bookings.length === 0 ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Empty state - the first thing a brand-new customer sees right
              after registering, so it needs to feel inviting rather than
              like a dead end. */}
          <div className="card relative overflow-hidden text-center lg:col-span-2">
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
              <img
                src="https://images.unsplash.com/photo-1647381518264-97ff1835026f?auto=format&fit=crop&w=1200&q=80"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative py-6">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-700">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">{t('dashboard.emptyTitle')}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">{t('dashboard.emptyDesc')}</p>
              <Link to="/band-qilish" className="btn-primary mt-6 inline-flex">
                {t('dashboard.newBooking')}
              </Link>
            </div>
          </div>

          {/* Trust row - the same reassurance a logged-out visitor gets on
              the home page, so the dashboard doesn't feel like "less". */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
            {trustPoints.slice(0, 3).map((tp, i) => {
              const Icon = TRUST_ICONS[i] ?? ShieldCheck
              return (
                <div key={tp.label} className="card flex items-start gap-3 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{tp.label}</div>
                    <div className="mt-0.5 text-xs text-gray-500">{tp.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => {
            const status = statusMeta[b.status] ?? statusMeta.pending
            return (
              <Link to={`/kabinet/buyurtma/${b.id}`} key={b.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {b.service_types ? getServiceName(b.service_types, lang) : 'Xizmat'}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {b.address}, {b.city} · {b.scheduled_date} {b.scheduled_time}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>{status.label}</span>
                  <span className="font-bold text-gray-900">{formatUZS(b.total_amount)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {!loading && services.length > 0 && (
        <div className="mt-14">
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.showcaseTitle')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('dashboard.showcaseDesc')}</p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.id} delayMs={i * 100}>
                <div className="card group h-full overflow-hidden p-0 transition hover:border-brand-300 hover:shadow-md">
                  <div className="h-36 w-full overflow-hidden bg-gray-100">
                    <img
                      src={s.image || FALLBACK_IMAGE}
                      alt={getServiceName(s, lang)}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-gray-900">{getServiceName(s, lang)}</div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{s.description_uz}</p>
                    <Link to="/band-qilish" className="btn-secondary mt-3 inline-block w-full py-2 text-center text-sm">
                      {t('dashboard.bookThis')}
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
