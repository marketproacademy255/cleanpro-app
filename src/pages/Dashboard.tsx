import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { getServiceName } from '@/lib/i18nHelpers'
import { fetchActiveServiceTypes } from '@/lib/publicData'
import { formatUZS } from '@/lib/pricing'
import type { Booking, ServiceType } from '@/lib/types'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { t, lang } = useTranslation()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending: { label: t('dashboard.statusPending'), color: 'bg-amber-50 text-amber-700' },
    confirmed: { label: t('dashboard.statusConfirmed'), color: 'bg-blue-50 text-blue-700' },
    assigned: { label: t('dashboard.statusAssigned'), color: 'bg-indigo-50 text-indigo-700' },
    in_progress: { label: t('dashboard.statusInProgress'), color: 'bg-purple-50 text-purple-700' },
    completed: { label: t('dashboard.statusCompleted'), color: 'bg-green-50 text-green-700' },
    cancelled: { label: t('dashboard.statusCancelled'), color: 'bg-gray-100 text-gray-500' },
  }

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
        <div className="card mt-6 text-center text-gray-500">{t('dashboard.noBookings')}</div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => {
            const status = STATUS_LABEL[b.status] ?? STATUS_LABEL.pending
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
            {services.map((s) => (
              <div key={s.id} className="card overflow-hidden p-0">
                <div className="h-36 w-full overflow-hidden bg-gray-100">
                  <img src={s.image || FALLBACK_IMAGE} alt={getServiceName(s, lang)} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="font-semibold text-gray-900">{getServiceName(s, lang)}</div>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">{s.description_uz}</p>
                  <Link to="/band-qilish" className="btn-secondary mt-3 inline-block w-full py-2 text-center text-sm">
                    {t('dashboard.bookThis')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
