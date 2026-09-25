import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { triggerHaptic } from '@/lib/haptics'
import { loginSchema, type LoginFormValues } from '@/lib/validationSchemas'

export default function Login() {
  const { signIn } = useAuth()
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

          <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="mt-6 space-y-4">
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
