import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { formatUZS } from '@/lib/pricing'
import { buildClickCheckoutUrl, buildPaymeCheckoutUrl, paymentGatewaysConfigured } from '@/lib/payments'
import type { Booking } from '@/lib/types'

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState<'payme' | 'click' | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) return
      const data = await apiFetch<Booking>(`bookings?id=${id}`).catch(() => null)
      setBooking(data)
      setLoading(false)
    }
    load()
  }, [id])

  const gateways = paymentGatewaysConfigured()
  const isPaid = booking?.payments?.some((p) => p.status === 'paid')

  async function pay(provider: 'payme' | 'click') {
    if (!booking) return
    setRedirecting(provider)

    // Register a pending payment row so the edge function webhook can match
    // the incoming provider transaction back to this booking.
    await apiFetch('payments', {
      method: 'POST',
      body: JSON.stringify({ booking_id: booking.id, provider }),
    }).catch(() => null)

    const returnUrl = `${import.meta.env.VITE_APP_URL}/tolov-natijasi?booking=${booking.id}`
    const url =
      provider === 'payme'
        ? buildPaymeCheckoutUrl({ bookingId: booking.id, amountSom: booking.total_amount, returnUrl })
        : buildClickCheckoutUrl({ bookingId: booking.id, amountSom: booking.total_amount, returnUrl })

    window.location.href = url
  }

  if (loading) return <div className="section py-20 text-center text-gray-400">Yuklanmoqda…</div>
  if (!booking) return <div className="section py-20 text-center text-gray-400">Buyurtma topilmadi.</div>

  return (
    <div className="section max-w-2xl py-14">
      <h1 className="text-2xl font-bold text-gray-900">Buyurtma tafsilotlari</h1>

      <div className="card mt-6 space-y-2 text-sm">
        <Row label="Xizmat" value={booking.service_types?.name_uz ?? '-'} />
        <Row label="Manzil" value={`${booking.address}, ${booking.city}`} />
        <Row label="Sana / vaqt" value={`${booking.scheduled_date} ${booking.scheduled_time}`} />
        <Row label="Aloqa" value={`${booking.contact_name} · ${booking.contact_phone}`} />
        <hr />
        <Row label="Jami summa" value={<span className="text-lg font-bold text-gray-900">{formatUZS(booking.total_amount)}</span>} />
      </div>

      {isPaid ? (
        <div className="card mt-6 border-brand-200 bg-brand-50 text-brand-700">
          ✅ To'lov muvaffaqiyatli amalga oshirildi. Xizmatchimiz belgilangan vaqtda tashrif buyuradi.
        </div>
      ) : (
        <div className="card mt-6">
          <h3 className="font-semibold text-gray-900">To'lov usulini tanlang</h3>
          {!gateways.payme && !gateways.click && (
            <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              Payme/Click merchant kalitlari hali sozlanmagan (.env faylida VITE_PAYME_MERCHANT_ID va
              VITE_CLICK_MERCHANT_ID). Demo rejimda to'lov havolasi noto'g'ri bo'lishi mumkin.
            </p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button onClick={() => pay('payme')} disabled={redirecting !== null} className="btn-primary">
              {redirecting === 'payme' ? "Yo'naltirilmoqda…" : "Payme orqali to'lash"}
            </button>
            <button onClick={() => pay('click')} disabled={redirecting !== null} className="btn-secondary">
              {redirecting === 'click' ? "Yo'naltirilmoqda…" : "Click orqali to'lash"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-right text-gray-900">{value}</span>
    </div>
  )
}
