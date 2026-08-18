import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { formatUZS, TIER_LABEL_UZ } from '@/lib/pricing'
import { buildClickCheckoutUrl, buildPaymeCheckoutUrl, paymentGatewaysConfigured } from '@/lib/payments'
import { fileToReceiptDataUrl } from '@/lib/receiptFile'
import type { Booking } from '@/lib/types'

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>()
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
          : "Chekni yuklab bo'lmadi. Qaytadan urinib ko'ring.",
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

  if (loading) return <div className="section py-20 text-center text-gray-400">Yuklanmoqda…</div>
  if (!booking) return <div className="section py-20 text-center text-gray-400">Buyurtma topilmadi.</div>

  return (
    <div className="section max-w-2xl py-14">
      <h1 className="text-2xl font-bold text-gray-900">Buyurtma tafsilotlari</h1>

      <div className="card mt-6 space-y-2 text-sm">
        <Row label="Xizmat" value={booking.service_types?.name_uz ?? '-'} />
        <Row label="Tarif" value={TIER_LABEL_UZ[booking.tier] ?? TIER_LABEL_UZ.standard} />
        <Row label="Manzil" value={`${booking.address}, ${booking.city}`} />
        <Row label="Sana / vaqt" value={`${booking.scheduled_date} ${booking.scheduled_time}`} />
        <Row label="Aloqa" value={`${booking.contact_name} · ${booking.contact_phone}`} />
        <hr />
        <Row label="Jami summa" value={<span className="text-lg font-bold text-gray-900">{formatUZS(booking.total_amount)}</span>} />
      </div>

      {isPaid ? (
        <div className="card mt-6 flex items-start gap-2.5 border-brand-200 bg-brand-50 text-brand-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          To'lov muvaffaqiyatli amalga oshirildi. Xizmatchimiz belgilangan vaqtda tashrif buyuradi.
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

          <hr className="my-5" />

          <h4 className="text-sm font-semibold text-gray-900">Yoki to'lov chekini yuklang</h4>
          <p className="mt-1 text-xs text-gray-500">
            Bank orqali to'g'ridan-to'g'ri to'lov qilgan bo'lsangiz, chek rasmini (yoki PDF) yuklang — administrator
            tekshirib, buyurtmani tasdiqlaydi.
          </p>

          {manualPayment?.status === 'pending' && manualPayment.receipt_url ? (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              Chek yuborildi, tekshirilmoqda. {' '}
              <a href={manualPayment.receipt_url} target="_blank" rel="noreferrer" className="underline">
                Yuklangan faylni ko'rish
              </a>
            </div>
          ) : manualPayment?.status === 'failed' ? (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">
              Oldingi chek rad etildi. Iltimos, to'g'ri chekni qaytadan yuklang.
            </div>
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
              {uploading ? 'Yuklanmoqda…' : "Chekni yuklash"}
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
