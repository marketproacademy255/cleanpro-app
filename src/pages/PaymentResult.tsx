import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useTranslation } from '@/context/LanguageContext'
import type { Booking } from '@/lib/types'

/**
 * Page the user lands on after returning from the Payme/Click hosted
 * checkout. The actual payment confirmation happens server-side via the
 * gateway webhook calling our Netlify Functions — this page just
 * polls the booking/payment status so the customer sees a friendly result.
 */
export default function PaymentResult() {
  const [params] = useSearchParams()
  const bookingId = params.get('booking')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    let attempts = 0
    let cancelled = false

    async function poll() {
      if (!bookingId || cancelled) return
      const data = await apiFetch<Booking>(`bookings?id=${bookingId}`).catch(() => null)

      if (cancelled) return
      setBooking(data)
      setLoading(false)

      const isPaid = data?.payments?.some((p) => p.status === 'paid')
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
        <p className="text-gray-400">{t('paymentResult.checking')}</p>
      ) : isPaid ? (
        <>
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('paymentResult.successTitle')}</h1>
          <p className="mt-2 text-gray-500">{t('paymentResult.successDesc')}</p>
        </>
      ) : (
        <>
          <span className="grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-600">
            <Clock className="h-9 w-9" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('paymentResult.pendingTitle')}</h1>
          <p className="mt-2 text-gray-500">{t('paymentResult.pendingDesc')}</p>
        </>
      )}
      {bookingId && (
        <Link to={`/kabinet/buyurtma/${bookingId}`} className="btn-primary mt-6">
          {t('paymentResult.viewBooking')}
        </Link>
      )}
    </div>
  )
}
