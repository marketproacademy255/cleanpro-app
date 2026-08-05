import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import type { Booking } from '@/lib/types'

/**
 * Page the user lands on after returning from the Payme/Click hosted
 * checkout. The actual payment confirmation happens server-side via the
 * gateway webhook calling our Supabase Edge Functions — this page just
 * polls the booking/payment status so the customer sees a friendly result.
 */
export default function PaymentResult() {
  const [params] = useSearchParams()
  const bookingId = params.get('booking')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let attempts = 0
    let cancelled = false

    async function poll() {
      if (!bookingId || cancelled) return
      const { data } = await supabase
        .from('bookings')
        .select('*, payments(*)')
        .eq('id', bookingId)
        .single()

      if (cancelled) return
      setBooking(data as Booking)
      setLoading(false)

      const isPaid = (data as Booking | null)?.payments?.some((p) => p.status === 'paid')
      attempts += 1
      if (!isPaid && attempts < 10) {
        setTimeout(poll, 2000)
      }
    }
    poll()
    return () => {
      cancelled = true
    }
  }, [bookingId])

  const isPaid = booking?.payments?.some((p) => p.status === 'paid')

  return (
    <div className="section flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-14 text-center">
      {loading ? (
        <p className="text-gray-400">To'lov holati tekshirilmoqda…</p>
      ) : isPaid ? (
        <>
          <div className="text-5xl">✅</div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">To'lov muvaffaqiyatli!</h1>
          <p className="mt-2 text-gray-500">Buyurtmangiz tasdiqlandi. Xizmatchimiz belgilangan vaqtda tashrif buyuradi.</p>
        </>
      ) : (
        <>
          <div className="text-5xl">⏳</div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">To'lov kutilmoqda</h1>
          <p className="mt-2 text-gray-500">
            To'lovingiz hali tasdiqlanmadi. Agar to'lov jarayonini yakunlagan bo'lsangiz, bir necha daqiqada holat
            yangilanadi.
          </p>
        </>
      )}
      {bookingId && (
        <Link to={`/kabinet/buyurtma/${bookingId}`} className="btn-primary mt-6">
          Buyurtmani ko'rish
        </Link>
      )}
    </div>
  )
}
