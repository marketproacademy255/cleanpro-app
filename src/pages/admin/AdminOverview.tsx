import { useEffect, useState } from 'react'
import { ClipboardList, Clock, TrendingUp, Wallet } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { formatUZS } from '@/lib/pricing'
import type { Booking } from '@/lib/types'

export default function AdminOverview() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await apiFetch<Booking[]>('bookings').catch(() => [])
      setBookings(data)
      setLoading(false)
    }
    load()
  }, [])

  const totalRevenue = bookings
    .filter((b) => b.payments?.some((p) => p.status === 'paid'))
    .reduce((sum, b) => sum + b.total_amount, 0)
  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const activeCount = bookings.filter((b) => ['confirmed', 'assigned', 'in_progress'].includes(b.status)).length

  if (loading) return <div className="text-gray-400">Yuklanmoqda…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Umumiy holat</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm text-gray-500">Jami buyurtmalar</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{bookings.length}</div>
          </div>
        </div>
        <div className="card flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm text-gray-500">To'lov kutilmoqda</div>
            <div className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</div>
          </div>
        </div>
        <div className="card flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm text-gray-500">Jarayonda</div>
            <div className="mt-1 text-2xl font-bold text-brand-700">{activeCount}</div>
          </div>
        </div>
        <div className="card flex items-start gap-3 sm:col-span-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm text-gray-500">To'langan buyurtmalardan tushum</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{formatUZS(totalRevenue)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
