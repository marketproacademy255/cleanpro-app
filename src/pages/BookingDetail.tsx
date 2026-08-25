import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { Check, CheckCircle2, XCircle } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { useTranslation } from '@/context/LanguageContext'
import { getServiceName } from '@/lib/i18nHelpers'
import { formatUZS } from '@/lib/pricing'
import { bookingStatusMeta, STATUS_STEPS } from '@/lib/bookingStatus'
import { buildClickCheckoutUrl, buildPaymeCheckoutUrl, paymentGatewaysConfigured } from '@/lib/payments'
import { fileToReceiptDataUrl } from '@/lib/receiptFile'
import StarRating from '@/components/StarRating'
import type { Booking, BookingStatus, BookingTier } from '@/lib/types'

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, lang } = useTranslation()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState<'payme' | 'click' | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function reload() {
    if (!id) return
    const data = await apiFetch<Booking>(`bookings?id=${id}`).catch(() => null)
    setBooking(data)
  }

  useEffect(() => {
    async function load() {
      if (!id) return setLoading(false)
      try {
        await reload()
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const gateways = paymentGatewaysConfigured()
  const isPaid = booking?.payments?.some((p) => p.status === 'paid')
  const manualPayment = booking?.payments
    ?.filter((p) => p.provider === 'manual')
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]

  async function uploadReceipt(file: File) {
    if (!booking) return
    setUploadError(null)
    setUploading(true)
    try {
      // No Firebase Storage bucket on this project (it now requires the
      // paid Blaze plan) - the receipt is downscaled/compressed and stored
      // as a data: URL directly on the payment doc instead. See
      // src/lib/receiptFile.ts.
      const receiptUrl = await fileToReceiptDataUrl(file)

      await apiFetch('payments', {
        method: 'POST',
        body: JSON.stringify({ booking_id: booking.id, provider: 'manual', receipt_url: receiptUrl }),
      })
      await reload()
    } catch (err) {
      setUploadError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : t('bookingDetail.uploadError'),
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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

  if (loading) return <div className="section py-20 text-center text-gray-400">{t('bookingDetail.loading')}</div>
  if (!booking) return <div className="section py-20 text-center text-gray-400">{t('bookingDetail.notFound')}</div>

  const tierLabels = t('pricing.tierLabels') as Record<BookingTier, string>

  return (
    <div className="section max-w-2xl py-14">
      <h1 className="text-2xl font-bold text-gray-900">{t('bookingDetail.title')}</h1>

      <StatusStepper status={booking.status} />

      {booking.cleaners && (
        <div className="card mt-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('bookingDetail.assignedCleaner')}</h3>
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {booking.cleaners.full_name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{booking.cleaners.full_name}</div>
              <div className="mt-1">
                <StarRating rating={booking.cleaners.rating} />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {booking.cleaners.years_experience} {t('home.teamExperience')}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mt-6 space-y-2 text-sm">
        <Row label={t('bookingDetail.service')} value={booking.service_types ? getServiceName(booking.service_types, lang) : '-'} />
        <Row label={t('bookingDetail.tier')} value={tierLabels[booking.tier] ?? tierLabels.standard} />
        <Row label={t('bookingDetail.address')} value={`${booking.address}, ${booking.city}`} />
        <Row label={t('bookingDetail.dateTime')} value={`${booking.scheduled_date} ${booking.scheduled_time}`} />
        <Row label={t('bookingDetail.contact')} value={`${booking.contact_name} · ${booking.contact_phone}`} />
        <hr />
        <Row label={t('bookingDetail.total')} value={<span className="text-lg font-bold text-gray-900">{formatUZS(booking.total_amount)}</span>} />
      </div>

      {isPaid ? (
        <div className="card mt-6 flex items-start gap-2.5 border-brand-200 bg-brand-50 text-brand-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          {t('bookingDetail.paidMessage')}
        </div>
      ) : (
        <div className="card mt-6">
          <h3 className="font-semibold text-gray-900">{t('bookingDetail.choosePayment')}</h3>
          {!gateways.payme && !gateways.click && (
            <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">{t('bookingDetail.gatewaysWarning')}</p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button onClick={() => pay('payme')} disabled={redirecting !== null} className="btn-primary">
              {redirecting === 'payme' ? t('bookingDetail.redirecting') : t('bookingDetail.payWithPayme')}
            </button>
            <button onClick={() => pay('click')} disabled={redirecting !== null} className="btn-secondary">
              {redirecting === 'click' ? t('bookingDetail.redirecting') : t('bookingDetail.payWithClick')}
            </button>
          </div>

          <hr className="my-5" />

          <h4 className="text-sm font-semibold text-gray-900">{t('bookingDetail.orUploadReceipt')}</h4>
          <p className="mt-1 text-xs text-gray-500">{t('bookingDetail.uploadReceiptDesc')}</p>

          {manualPayment?.status === 'pending' && manualPayment.receipt_url ? (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              {t('bookingDetail.receiptPending')} {' '}
              <a href={manualPayment.receipt_url} target="_blank" rel="noreferrer" className="underline">
                {t('bookingDetail.viewUploaded')}
              </a>
            </div>
          ) : manualPayment?.status === 'failed' ? (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">{t('bookingDetail.receiptRejected')}</div>
          ) : null}

          {uploadError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">{uploadError}</p>}

          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadReceipt(file)
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary"
            >
              {uploading ? t('bookingDetail.uploading') : t('bookingDetail.uploadReceipt')}
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

/** Horizontal progress stepper for pending -> confirmed -> assigned ->
 *  in_progress -> completed. `cancelled` can happen from any point in the
 *  flow, so it's shown as its own banner instead of trying to place it on
 *  the same line. */
function StatusStepper({ status }: { status: BookingStatus }) {
  const { t } = useTranslation()
  const meta = bookingStatusMeta(t)

  if (status === 'cancelled') {
    return (
      <div className="card mt-6 flex items-start gap-2.5 border-red-200 bg-red-50 text-red-600">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
        {t('bookingDetail.cancelledMessage')}
      </div>
    )
  }

  const currentIndex = STATUS_STEPS.indexOf(status)

  return (
    <div className="card mt-6">
      <div className="flex items-start">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIndex
          return (
            <div key={step} className="flex flex-1 items-start last:flex-none">
              <div className="flex w-16 flex-col items-center gap-2 sm:w-20">
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    done ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-center text-[11px] font-medium leading-tight ${done ? 'text-brand-700' : 'text-gray-400'}`}>
                  {meta[step].label}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`mt-4 h-0.5 flex-1 ${i < currentIndex ? 'bg-brand-600' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
