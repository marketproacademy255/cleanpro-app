import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithCustomToken } from 'firebase/auth'
import { CheckCircle2, Clock, ExternalLink, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { auth } from '@/lib/firebaseClient'
import { apiFetch, ApiError } from '@/lib/api'
import { triggerHaptic } from '@/lib/haptics'
import { registerSchema, type RegisterFormValues } from '@/lib/validationSchemas'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get('ref')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Verification states
  const [verifyState, setVerifyState] = useState<'unverified' | 'requesting' | 'waiting' | 'verified'>('unverified')
  const [activePhone, setActivePhone] = useState<string>('')
  const [botName, setBotName] = useState<string>('CleanVerificationBot')
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [])

  function startPolling(phone: string) {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current)

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await apiFetch<{ status: string; token?: string }>(
          `phone-verify-status?phone=${encodeURIComponent(phone)}`,
        )
        if (res.status === 'verified') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          setVerifyState('verified')
          triggerHaptic('success')

          if (res.token && auth) {
            await signInWithCustomToken(auth, res.token).catch(() => null)
          }

          await completeRegistration()
        }
      } catch {
        // Ignore polling errors
      }
    }, 2500)
  }

  async function handleVerifyClick() {
    setError(null)
    const isFormValid = await trigger(['fullName', 'phone', 'password'])
    if (!isFormValid) return

    const values = getValues()
    setVerifyState('requesting')
    setLoading(true)
    triggerHaptic('medium')

    try {
      const res = await apiFetch<{ ok: boolean; phone: string; botUsername: string }>('phone-verify-request', {
        method: 'POST',
        body: JSON.stringify({
          fullName: values.fullName,
          phone: values.phone,
          email: values.email,
          password: values.password,
        }),
      })

      setActivePhone(res.phone)
      if (res.botUsername) setBotName(res.botUsername)

      setVerifyState('waiting')
      triggerHaptic('success')
      startPolling(res.phone)
    } catch (err) {
      triggerHaptic('error')
      setVerifyState('unverified')
      setError(err instanceof ApiError ? err.message : "Tasdiqlash so'rovida xatolik yuz berdi.")
    } finally {
      setLoading(false)
    }
  }

  async function completeRegistration() {
    const values = getValues()
    setLoading(true)

    await signUp(values.email, values.password, values.fullName, values.phone).catch(() => null)

    if (referralCode) {
      await apiFetch('referrals', { method: 'POST', body: JSON.stringify({ code: referralCode }) }).catch(() => {})
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  async function onSubmit() {
    if (verifyState !== 'verified') {
      await handleVerifyClick()
      return
    }
    await completeRegistration()
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=1200&q=80"
          alt="Tozalangan yorug' xona"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/40 to-brand-900/10" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-2xl font-semibold leading-snug">{t('register.heroQuote')}</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-14 sm:px-6">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('register.title')}</h1>
          {done ? (
            <div className="mt-4 space-y-2">
              <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                ✅ Ro'yxatdan o'tish va telefon raqamingiz muvaffaqiyatli tasdiqlandi!
              </p>
              {referralCode && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {t('register.referralApplied')}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="label">{t('register.fullNameLabel')}</label>
                <input className="input" {...register('fullName')} />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="label">{t('register.phoneLabel')}</label>
                  {verifyState === 'verified' ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Tasdiqlandi
                    </span>
                  ) : verifyState === 'waiting' ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
                      <Clock className="h-3.5 w-3.5" /> Kutilmoqda...
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      ⚠️ Tasdiqlanmagan
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <input
                    className="input flex-1"
                    placeholder="+998 90 123 45 67"
                    disabled={verifyState === 'waiting' || verifyState === 'verified'}
                    {...register('phone')}
                  />
                  {verifyState !== 'verified' && (
                    <button
                      type="button"
                      onClick={handleVerifyClick}
                      disabled={loading || verifyState === 'waiting'}
                      className="rounded-lg bg-brand-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-brand-700 disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {verifyState === 'requesting' ? '...' : 'Tasdiqlash'}
                    </button>
                  )}
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              {/* Waiting for Telegram Verification Notification Box */}
              {verifyState === 'waiting' && (
                <div className="rounded-xl border border-amber-300/70 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 animate-spin" />
                    <div>
                      <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm">
                        📱 Telegram orqali telefon raqamni tasdiqlang
                      </h4>
                      <p className="mt-1 text-amber-800 dark:text-amber-300 leading-relaxed">
                        <b>{activePhone}</b> raqamingizni tasdiqlash uchun botimizga o'ting va <b>"📱 Raqamni yuborish"</b> tugmasini bosing.
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://t.me/${botName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 font-bold text-white shadow-md transition hover:bg-sky-700"
                  >
                    🤖 Telegram botni ochish (@{botName})
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <p className="text-[11px] text-center text-amber-700 dark:text-amber-400 animate-pulse">
                    ⏳ Botdan tasdiq kelgach bu sahifa avtomatik yangilanadi...
                  </p>
                </div>
              )}

              <div>
                <label className="label">{t('register.emailLabel')}</label>
                <input type="email" className="input" {...register('email')} />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">{t('register.passwordLabel')}</label>
                <input type="password" className="input" {...register('password')} />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || verifyState === 'waiting'}
                className="btn-primary w-full"
              >
                {loading
                  ? 'Kutilmoqda...'
                  : verifyState === 'verified'
                    ? "Ro'yxatdan o'tishni yakunlash"
                    : 'Tasdiqlash va Ro\'yxatdan o\'tish'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="font-medium text-brand-700 dark:text-brand-400">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
