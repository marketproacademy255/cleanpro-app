import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, ApiError } from '@/lib/api'
import { triggerHaptic } from '@/lib/haptics'
import { FullPageLoader } from '@/components/ProtectedRoute'

type Step = 'idle' | 'requesting' | 'waiting' | 'expired'

interface VerifyRequestResponse {
  status: 'pending' | 'verified'
  phone: string
  botUsername?: string
  botUrl?: string
  expiresAt?: string
}

const POLL_MS = 3000

/**
 * Telegram phone verification for an already signed-in user (email or
 * Google). See netlify/functions/_lib/phoneVerification.ts for the
 * protocol: we get a one-time bot deep link, the user shares their contact
 * in the bot, and we poll until the bot has marked the profile verified.
 */
export default function VerifyPhone() {
  const { user, profile, isVerified, loading, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const from = location.state?.from ?? '/dashboard'

  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [request, setRequest] = useState<VerifyRequestResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (profile?.phone && !phone) setPhone(profile.phone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone])

  useEffect(() => stopPolling, [])

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  function startPolling() {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch<{ status: string }>('phone-verify-status')
        if (res.status === 'verified') {
          stopPolling()
          triggerHaptic('success')
          // isVerified flips once the fresh profile is in -> redirect below.
          await refreshProfile()
        } else if (res.status === 'expired') {
          stopPolling()
          setStep('expired')
        }
      } catch {
        // Transient network error - keep polling.
      }
    }, POLL_MS)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setStep('requesting')
    triggerHaptic('medium')
    try {
      const res = await apiFetch<VerifyRequestResponse>('phone-verify-request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      })
      if (res.status === 'verified') {
        await refreshProfile()
        return
      }
      setRequest(res)
      setPhone(res.phone)
      setStep('waiting')
      startPolling()
    } catch (err) {
      triggerHaptic('error')
      setStep('idle')
      setError(err instanceof ApiError ? err.message : "Tasdiqlash so'rovida xatolik yuz berdi. Qayta urinib ko'ring.")
    }
  }

  async function handleSignOut() {
    stopPolling()
    await signOut()
    navigate('/login')
  }

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" state={{ from: '/verify-phone' }} replace />
  if (isVerified) return <Navigate to={from} replace />

  const waiting = step === 'waiting'

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-14 sm:px-6">
      <div className="card w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Telefon raqamni tasdiqlash</h1>
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Buyurtma berish va shaxsiy kabinetdan foydalanish uchun telefon raqamingizni Telegram orqali tasdiqlang.
          Raqam Telegram hisobingizga ulangan raqam bilan bir xil bo'lishi kerak.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="verify-phone">
              Telefon raqam
            </label>
            <input
              id="verify-phone"
              className="input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={waiting || step === 'requesting'}
              required
            />
          </div>

          {waiting && request?.botUrl && (
            <div className="space-y-3 rounded-2xl border border-brand-500/30 bg-brand-950/60 p-4 text-xs text-brand-100 shadow-xl dark:bg-brand-950/80">
              <ol className="list-decimal space-y-1 pl-4 text-gray-200">
                <li>Pastdagi tugma orqali botni oching (Telegram ilovasida <b>Start</b> bosing).</li>
                <li>
                  Botda <b>"📱 Raqamni yuborish"</b> tugmasini bosing.
                </li>
                <li>Shu sahifaga qayting - u avtomatik yangilanadi.</li>
              </ol>
              <a
                href={request.botUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-sky-500 active:scale-[0.99]"
              >
                <span>Telegram botni ochish{request.botUsername ? ` (@${request.botUsername})` : ''}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-brand-300/80">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                Tasdiqlash kutilmoqda...
              </p>
            </div>
          )}

          {step === 'expired' && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Havolaning muddati tugadi. Qaytadan "Tasdiqlash" tugmasini bosing.
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">{error}</p>
          )}

          {waiting ? (
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => {
                stopPolling()
                setStep('idle')
                setRequest(null)
              }}
            >
              Raqamni o'zgartirish
            </button>
          ) : (
            <button type="submit" disabled={step === 'requesting'} className="btn-primary flex w-full items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {step === 'requesting' ? 'Kutilmoqda...' : 'Tasdiqlash'}
            </button>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {user.email && <span className="block truncate">{user.email}</span>}
          <button type="button" onClick={handleSignOut} className="font-medium text-brand-700 dark:text-brand-400">
            Boshqa akkaunt bilan kirish
          </button>
        </p>
      </div>
    </div>
  )
}
