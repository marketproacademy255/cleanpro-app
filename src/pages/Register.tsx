import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { apiFetch } from '@/lib/api'
import { triggerHaptic } from '@/lib/haptics'
import { registerSchema, type RegisterFormValues } from '@/lib/validationSchemas'
import GoogleIcon from '@/components/GoogleIcon'

/**
 * Step 1 of sign-up: create the account (email/password or Google).
 * Step 2 - Telegram phone verification - happens on /verify-phone, which
 * every protected route redirects to until the phone is verified.
 */
export default function Register() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get('ref')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  async function finish() {
    if (referralCode) {
      await apiFetch('referrals', { method: 'POST', body: JSON.stringify({ code: referralCode }) }).catch(() => {})
    }
    triggerHaptic('success')
    // Already-verified returning (Google) users are sent straight on to the
    // dashboard by /verify-phone itself.
    navigate('/verify-phone', { replace: true })
  }

  async function onSubmit(data: RegisterFormValues) {
    setLoading(true)
    setError(null)
    triggerHaptic('medium')
    const { error: signUpError } = await signUp(data.email, data.password, data.fullName, data.phone)
    if (signUpError) {
      setLoading(false)
      triggerHaptic('error')
      setError(signUpError)
      return
    }
    await finish()
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    triggerHaptic('medium')
    const res = await signInWithGoogle()
    if (res.error || res.cancelled) {
      setLoading(false)
      if (res.error) {
        triggerHaptic('error')
        setError(res.error)
      }
      return
    }
    await finish()
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

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-2.5 px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
          >
            <GoogleIcon className="h-5 w-5" />
            <span>Google orqali davom etish</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 dark:bg-gray-900 dark:text-gray-500 font-medium">
                yoki ma'lumotlarni kiritib
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">{t('register.fullNameLabel')}</label>
              <input className="input" autoComplete="name" {...register('fullName')} />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="label">{t('register.phoneLabel')}</label>
              <input
                className="input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+998 90 123 45 67"
                {...register('phone')}
              />
              <p className="mt-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Keyingi qadamda shu raqam Telegram bot orqali tasdiqlanadi.
              </p>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="label">{t('register.emailLabel')}</label>
              <input type="email" className="input" autoComplete="email" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">{t('register.passwordLabel')}</label>
              <input type="password" className="input" autoComplete="new-password" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('register.submitting') : t('register.submit')}
            </button>
          </form>

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
