import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatUZS } from '@/lib/pricing'
import type { Booking } from '@/lib/types'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "To'lov kutilmoqda", color: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'Tasdiqlangan', color: 'bg-blue-50 text-blue-700' },
  assigned: { label: 'Xizmatchi tayinlandi', color: 'bg-indigo-50 text-indigo-700' },
  in_progress: { label: 'Bajarilmoqda', color: 'bg-purple-50 text-purple-700' },
  completed: { label: 'Bajarildi', color: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Bekor qilindi', color: 'bg-gray-100 text-gray-500' },
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const data = await apiFetch<Booking[]>('bookings').catch(() => [])
      setBookings(data)
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <div className="section py-14">
      <h1 className="text-3xl font-bold text-gray-900">Salom, {profile?.full_name || 'mijoz'}</h1>
      <p className="mt-2 text-gray-500">Buyurtmalaringiz tarixi va joriy holati.</p>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Buyurtmalarim</h2>
        <Link to="/band-qilish" className="btn-primary py-2">
          + Yangi buyurtma
        </Link>
      </div>

      {loading ? (
        <div className="mt-10 text-gray-400">Yuklanmoqda…</div>
      ) : bookings.length === 0 ? (
        <div className="card mt-6 text-center text-gray-500">Hozircha buyurtmalar yo'q.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => {
            const status = STATUS_LABEL[b.status] ?? STATUS_LABEL.pending
            return (
              <Link to={`/kabinet/buyurtma/${b.id}`} key={b.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{b.service_types?.name_uz ?? 'Xizmat'}</div>
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
    </div>
  )
}
