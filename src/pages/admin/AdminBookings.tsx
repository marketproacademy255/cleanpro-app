import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatUZS } from '@/lib/pricing'
import type { Booking, BookingStatus, Cleaner } from '@/lib/types'

const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled']

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [{ data: b }, { data: c }] = await Promise.all([
      supabase.from('bookings').select('*, service_types(*), cleaners(*), payments(*)').order('created_at', { ascending: false }),
      supabase.from('cleaners').select('*').eq('is_active', true),
    ])
    setBookings((b as Booking[]) ?? [])
    setCleaners((c as Cleaner[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(id: string, status: BookingStatus) {
    await supabase.from('bookings').update({ status }).eq('id', id)
    load()
  }

  async function assignCleaner(id: string, cleanerId: string) {
    await supabase.from('bookings').update({ cleaner_id: cleanerId || null }).eq('id', id)
    load()
  }

  if (loading) return <div className="text-gray-400">Yuklanmoqda…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Buyurtmalar</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Mijoz</th>
              <th className="px-4 py-3">Xizmat</th>
              <th className="px-4 py-3">Sana</th>
              <th className="px-4 py-3">Summa</th>
              <th className="px-4 py-3">To'lov</th>
              <th className="px-4 py-3">Xizmatchi</th>
              <th className="px-4 py-3">Holat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => {
              const paid = b.payments?.some((p) => p.status === 'paid')
              return (
                <tr key={b.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{b.contact_name}</div>
                    <div className="text-xs text-gray-400">{b.contact_phone}</div>
                  </td>
                  <td className="px-4 py-3">{b.service_types?.name_uz}</td>
                  <td className="px-4 py-3 text-gray-500">{b.scheduled_date} {b.scheduled_time}</td>
                  <td className="px-4 py-3 font-medium">{formatUZS(b.total_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${paid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {paid ? "To'landi" : 'Kutilmoqda'}
                    </span>
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
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
