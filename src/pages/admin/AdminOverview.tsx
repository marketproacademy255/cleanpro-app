import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  Clock,
  TrendingUp,
  Wallet,
  Calendar,
  CreditCard,
  PieChart,
  CheckCircle2,
  DollarSign,
} from 'lucide-react'
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

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const currentMonthPrefix = new Date().toISOString().slice(0, 7)

    let totalRev = 0
    let todayRev = 0
    let monthRev = 0
    let pendingCnt = 0
    let activeCnt = 0
    let completedCnt = 0

    const paymentMethods: Record<string, { count: number; total: number }> = {
      click: { count: 0, total: 0 },
      payme: { count: 0, total: 0 },
      cash: { count: 0, total: 0 },
      manual: { count: 0, total: 0 },
    }

    const serviceCounts: Record<string, { name: string; count: number; totalAmount: number }> = {}

    for (const b of bookings) {
      const isPaid = b.payments?.some((p) => p.status === 'paid') || b.status === 'confirmed' || b.status === 'completed'
      const amount = Number(b.total_amount) || 0
      const createdDate = b.created_at ? b.created_at.slice(0, 10) : b.scheduled_date
      const createdMonth = b.created_at ? b.created_at.slice(0, 7) : b.scheduled_date?.slice(0, 7)

      if (isPaid) {
        totalRev += amount
        if (createdDate === todayStr) {
          todayRev += amount
        }
        if (createdMonth === currentMonthPrefix) {
          monthRev += amount
        }
      }

      if (b.status === 'pending') pendingCnt++
      if (['confirmed', 'assigned', 'in_progress'].includes(b.status)) activeCnt++
      if (b.status === 'completed') completedCnt++

      // Payment method breakdown
      let provider = 'cash'
      if (b.payments && b.payments.length > 0) {
        const lastPayment = b.payments[b.payments.length - 1]
        provider = lastPayment.provider || 'cash'
      } else if (b.payment_method) {
        provider = b.payment_method
      }

      const key = ['click', 'payme', 'manual'].includes(provider) ? provider : 'cash'
      paymentMethods[key].count++
      if (isPaid) {
        paymentMethods[key].total += amount
      }

      // Service breakdown
      const serviceName = b.service_types?.name_uz || b.service_type_id || 'Tozalash'
      if (!serviceCounts[serviceName]) {
        serviceCounts[serviceName] = { name: serviceName, count: 0, totalAmount: 0 }
      }
      serviceCounts[serviceName].count++
      if (isPaid) {
        serviceCounts[serviceName].totalAmount += amount
      }
    }

    const sortedServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count)

    return {
      totalRev,
      todayRev,
      monthRev,
      pendingCnt,
      activeCnt,
      completedCnt,
      paymentMethods,
      sortedServices,
    }
  }, [bookings])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <Clock className="mr-2 h-5 w-5 animate-spin text-brand-600" />
        <span>Tizim analitikasi yuklanmoqda…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Boshqaruv paneli analitikasi</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Moliya, buyurtmalar statistikasi va to'lov usullari bo'yicha real vaqtdagi ko'rsatkichlar.
          </p>
        </div>
      </div>

      {/* Main Financial & Order KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Revenue */}
        <div className="card flex items-start gap-3 border-l-4 border-l-emerald-500">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Bugungi tushum</div>
            <div className="mt-1 text-xl font-extrabold text-gray-900 dark:text-gray-100">
              {formatUZS(stats.todayRev)}
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="card flex items-start gap-3 border-l-4 border-l-brand-500">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Ushbu oydagi tushum</div>
            <div className="mt-1 text-xl font-extrabold text-gray-900 dark:text-gray-100">
              {formatUZS(stats.monthRev)}
            </div>
          </div>
        </div>

        {/* Active Bookings */}
        <div className="card flex items-start gap-3 border-l-4 border-l-blue-500">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Faol buyurtmalar</div>
            <div className="mt-1 text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {stats.activeCnt} <span className="text-xs font-normal text-gray-400">ta</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="card flex items-start gap-3 border-l-4 border-l-purple-500">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Jami tushum (barchasi)</div>
            <div className="mt-1 text-xl font-extrabold text-gray-900 dark:text-gray-100">
              {formatUZS(stats.totalRev)}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Status Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <ClipboardList className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs text-gray-500">Jami buyurtmalar</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{bookings.length} ta</div>
            </div>
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs text-gray-500">To'lov / Tasdiq kutilmoqda</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.pendingCnt} ta</div>
            </div>
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs text-gray-500">Bajarilgan buyurtmalar</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.completedCnt} ta</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdowns: Payment Methods & Popular Services */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Methods Breakdown */}
        <div className="card">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
            <CreditCard className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100">To'lov turlari bo'yicha statistika</h3>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 dark:border-blue-900/30 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-300">Click</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {stats.paymentMethods.click.count} ta buyurtma
                </span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-blue-950 dark:text-blue-200">
                {formatUZS(stats.paymentMethods.click.total)}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">Payme</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {stats.paymentMethods.payme.count} ta buyurtma
                </span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-emerald-950 dark:text-emerald-200">
                {formatUZS(stats.paymentMethods.payme.total)}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-gray-200">Naqd pul (Cash)</span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {stats.paymentMethods.cash.count} ta buyurtma
                </span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-gray-900 dark:text-gray-100">
                {formatUZS(stats.paymentMethods.cash.total)}
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 dark:border-amber-900/30 dark:bg-amber-950/20">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 dark:text-amber-300">Qo'lda (Chek o'tkazma)</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  {stats.paymentMethods.manual.count} ta buyurtma
                </span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-amber-950 dark:text-amber-200">
                {formatUZS(stats.paymentMethods.manual.total)}
              </div>
            </div>
          </div>
        </div>

        {/* Popular Services Breakdown */}
        <div className="card">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
            <PieChart className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Eng ommabop xizmatlar taqsimoti</h3>
          </div>

          <div className="mt-4 space-y-3">
            {stats.sortedServices.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">Xizmatlar statistikasi mavjud emas.</div>
            ) : (
              stats.sortedServices.slice(0, 5).map((srv) => {
                const percentage = bookings.length ? Math.round((srv.count / bookings.length) * 100) : 0
                return (
                  <div key={srv.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-900 dark:text-gray-200">{srv.name}</span>
                      <span className="font-mono font-medium text-gray-500 dark:text-gray-400">
                        {srv.count} ta buyurtma ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
