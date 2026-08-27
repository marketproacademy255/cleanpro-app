import { Fragment, useEffect, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { fetchActiveCleaners } from '@/lib/publicData'
import { apiFetch } from '@/lib/api'
import { formatUZS } from '@/lib/pricing'
import type { Booking, BookingStatus, Cleaner } from '@/lib/types'

const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled']

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function load() {
    const [b, c] = await Promise.all([apiFetch<Booking[]>('bookings').catch(() => []), fetchActiveCleaners()])
    setBookings(b)
    setCleaners(c)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(id: string, status: BookingStatus) {
    await apiFetch(`bookings?id=${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    load()
  }

  async function assignCleaner(id: string, cleanerId: string) {
    await apiFetch(`bookings?id=${id}`, { method: 'PATCH', body: JSON.stringify({ cleaner_id: cleanerId || null }) })
    load()
  }

  async function markPaymentStatus(paymentId: string, status: 'paid' | 'failed') {
    await apiFetch(`payments?id=${paymentId}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    load()
  }

  // Manual price override - mainly for repair/renovation quotes: the flat
  // per-sqm formula is a starting estimate, the admin reviews the
  // customer's uploaded photos/description (repair_photos/repair_notes)
  // and adjusts total_amount to the real quote.
  async function overridePrice(id: string, currentAmount: number) {
    const input = window.prompt("Yangi umumiy summa (so'm):", String(currentAmount))
    if (input === null) return
    const amount = Number(input.replace(/\s/g, ''))
    if (!Number.isFinite(amount) || amount < 0) {
      window.alert("Noto'g'ri summa.")
      return
    }
    await apiFetch(`bookings?id=${id}`, { method: 'PATCH', body: JSON.stringify({ total_amount: amount }) })
    load()
  }

  if (loading) return <div className="text-gray-400">Yuklanmoqda…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Buyurtmalar</h1>
      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Mijoz</th>
              <th className="px-4 py-3">Xizmat</th>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3">Summa</th>
              <th className="px-4 py-3">To'lov</th>
              <th className="px-4 py-3">Chek</th>
              <th className="px-4 py-3">Xizmatchi</th>
              <th className="px-4 py-3">Holat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => {
              const paid = b.payments?.some((p) => p.status === 'paid')
              const manualPending = b.payments?.find((p) => p.provider === 'manual' && p.status === 'pending' && p.receipt_url)
              const hasRepairInfo = !!(b.repair_notes || (b.repair_photos && b.repair_photos.length > 0))
              const expanded = expandedId === b.id
              return (
                <Fragment key={b.id}>
                  <tr>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="font-medium text-gray-900">{b.contact_name}</div>
                        {hasRepairInfo && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : b.id)}
                            title="Loyiha rasmlari/tavsifi"
                            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100"
                          >
                            <ImageIcon className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{b.contact_phone}</div>
                    </td>
                    <td className="px-4 py-3">{b.service_types?.name_uz}</td>
                    <td className="px-4 py-3 text-gray-500">{b.scheduled_date} {b.scheduled_time}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => overridePrice(b.id, b.total_amount)}
                        title="Narxni qo'lda o'zgartirish"
                        className="font-medium text-gray-900 underline decoration-dotted underline-offset-2 hover:text-brand-700"
                      >
                        {formatUZS(b.total_amount)}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${paid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {paid ? "To'landi" : 'Kutilmoqda'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {manualPending ? (
                      <div className="flex flex-col items-start gap-1">
                        <a href={manualPending.receipt_url!} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-700 underline">
                          Chekni ko'rish
                        </a>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => markPaymentStatus(manualPending.id, 'paid')}
                            className="rounded-md bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand-700"
                          >
                            Tasdiqlash
                          </button>
                          <button
                            type="button"
                            onClick={() => markPaymentStatus(manualPending.id, 'failed')}
                            className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-50"
                          >
                            Rad etish
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select className="input py-1.5 text-xs" value={b.cleaner_id ?? ''} onChange={(e) => assignCleaner(b.id, e.target.value)}>
                      <option value="">Tayinlanmagan</option>
                      {cleaners.map((c) => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select className="input py-1.5 text-xs" value={b.status} onChange={(e) => updateStatus(b.id, e.target.value as BookingStatus)}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  </tr>
                  {expanded && hasRepairInfo && (
                    <tr>
                      <td colSpan={8} className="bg-gray-50 px-4 py-3">
                        {b.repair_notes && (
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold text-gray-900">Loyiha tavsifi: </span>
                            {b.repair_notes}
                          </p>
                        )}
                        {b.repair_photos && b.repair_photos.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {b.repair_photos.map((src, i) => (
                              <a key={i} href={src} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-md border border-gray-200">
                                <img src={src} alt="" className="h-full w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
