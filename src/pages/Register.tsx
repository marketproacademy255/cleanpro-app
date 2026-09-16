import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { TELEGRAM_BOT_USERNAME } from '@/lib/config'
import { apiFetch } from '@/lib/api'
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterFormValues) {
    setLoading(true)
    setError(null)
    triggerHaptic('medium')
    const { error: signUpError } = await signUp(data.email, data.password, data.fullName, data.phone)
    setLoading(false)
    if (signUpError) {
      triggerHaptic('error')
      setError(signUpError)
      return
    }

    if (referralCode) {
      await apiFetch('referrals', { method: 'POST', body: JSON.stringify({ code: referralCode }) }).catch(() => {})
    }
    triggerHaptic('success')
    setDone(true)
    setTimeout(() => navigate('/login'), 1500)
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
              <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">{t('register.successMessage')}</p>
              {referralCode && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{t('register.referralApplied')}</p>
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
                <label className="label">{t('register.phoneLabel')}</label>
                <input className="input" placeholder="+998 90 123 45 67" {...register('phone')} />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>
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
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t('register.submitting') : t('register.submit')}
              </button>
            </form>
          )}

          {TELEGRAM_BOT_USERNAME && !done && (
            <a
              href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=signup`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300"
            >
              {t('register.telegramButton')}
            </a>
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

