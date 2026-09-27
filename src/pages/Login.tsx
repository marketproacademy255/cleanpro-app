import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { triggerHaptic } from '@/lib/haptics'
import { loginSchema, type LoginFormValues } from '@/lib/validationSchemas'
import GoogleIcon from '@/components/GoogleIcon'

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const location = useLocation() as { state?: { from?: string; message?: string } }

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit: handleEmailSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onEmailSubmit(data: LoginFormValues) {
    setLoading(true)
    setError(null)
    triggerHaptic('medium')
    const { error: signInError } = await signIn(data.email, data.password)
    setLoading(false)
    if (signInError) {
      triggerHaptic('error')
      setError(signInError)
      return
    }
    triggerHaptic('success')
    navigate(location.state?.from ?? '/dashboard')
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)
    triggerHaptic('medium')
    const res = await signInWithGoogle()
    setLoading(false)

    if (res.error) {
      triggerHaptic('error')
      setError(res.error)
      return
    }

    if (!res.user) {
      return
    }

    if (res.isExistingUser) {
      triggerHaptic('success')
      navigate(location.state?.from ?? '/dashboard')
    } else {
      triggerHaptic('medium')
      navigate('/register', {
        state: {
          googleUser: {
            displayName: res.user.displayName,
            email: res.user.email,
            uid: res.user.uid,
          },
          message:
            "Google hisobingiz muvaffaqiyatli ulandi! Ro'yxatdan o'tishni yakunlash uchun telefon raqamingizni kiriting va Telegram bot orqali tasdiqlang.",
        },
      })
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=1200&q=80"
          alt="Xizmatchi uyni tozalamoqda"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/40 to-brand-900/10" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-2xl font-semibold leading-snug">{t('login.heroQuote')}</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-14 sm:px-6">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('login.title')}</h1>
          {location.state?.message && (
            <p className="mt-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {location.state.message}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
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
                yoki email bilan
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
            <div>
              <label className="label">{t('login.emailLabel')}</label>
              <input type="email" className="input" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">{t('login.passwordLabel')}</label>
              <input type="password" className="input" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('login.loggingIn') : t('login.loginButton')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-medium text-brand-700 dark:text-brand-400">
              {t('login.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
