import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithCustomToken } from 'firebase/auth'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { auth } from '@/lib/firebaseClient'
import { apiFetch, ApiError } from '@/lib/api'
import { TELEGRAM_BOT_USERNAME } from '@/lib/config'
import { triggerHaptic } from '@/lib/haptics'
import { loginSchema, type LoginFormValues } from '@/lib/validationSchemas'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const location = useLocation() as { state?: { from?: string; message?: string } }
  const [mode, setMode] = useState<'email' | 'telegram'>('email')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // --- Telegram phone+password+code flow ---
  const [tgStep, setTgStep] = useState<'credentials' | 'code'>('credentials')
  const [tgPhone, setTgPhone] = useState('')
  const [tgPassword, setTgPassword] = useState('')
  const [tgCode, setTgCode] = useState('')

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

  async function requestTelegramCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    triggerHaptic('medium')
    try {
      await apiFetch('telegram-login-request', {
        method: 'POST',
        body: JSON.stringify({ phone: tgPhone, password: tgPassword }),
      })
      setTgStep('code')
      triggerHaptic('success')
    } catch (err) {
      triggerHaptic('error')
      setError(err instanceof ApiError ? err.message : t('login.codeSendError'))
    } finally {
      setLoading(false)
    }
  }

  async function verifyTelegramCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    triggerHaptic('medium')
    try {
      if (!auth) throw new Error(t('login.serviceUnavailable'))
      const { token } = await apiFetch<{ token: string }>('telegram-login-verify', {
        method: 'POST',
        body: JSON.stringify({ phone: tgPhone, code: tgCode }),
      })
      await signInWithCustomToken(auth, token)
      triggerHaptic('success')
      navigate(location.state?.from ?? '/dashboard')
    } catch (err) {
      triggerHaptic('error')
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error && err.message
            ? err.message
            : t('login.verifyError'),
      )
    } finally {
      setLoading(false)
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

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-1 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light')
                setMode('email')
                setError(null)
              }}
              className={`rounded-md py-2 text-sm font-medium transition ${
                mode === 'email' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'
              }`}
            >
              {t('login.email')}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light')
                setMode('telegram')
                setError(null)
              }}
              className={`rounded-md py-2 text-sm font-medium transition ${
                mode === 'telegram' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'
              }`}
            >
              {t('login.telegram')}
            </button>
          </div>

          {mode === 'email' ? (
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
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t('login.loggingIn') : t('login.loginButton')}
              </button>
            </form>
          ) : tgStep === 'credentials' ? (
            <form onSubmit={requestTelegramCode} className="mt-6 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('login.telegramIntro')}</p>
              <div>
                <label className="label">{t('login.phoneLabel')}</label>
                <input
                  className="input"
                  placeholder="+998 90 123 45 67"
                  value={tgPhone}
                  onChange={(e) => setTgPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">{t('login.passwordLabel')}</label>
                <input
                  type="password"
                  className="input"
                  value={tgPassword}
                  onChange={(e) => setTgPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t('login.sendingCode') : t('login.sendCodeButton')}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyTelegramCode} className="mt-6 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('login.codeSentIntro')} ({tgPhone}).</p>
              <div>
                <label className="label">{t('login.codeLabel')}</label>
                <input
                  className="input tracking-widest text-center text-lg font-bold"
                  placeholder="123456"
                  maxLength={6}
                  value={tgCode}
                  onChange={(e) => setTgCode(e.target.value)}
                  required
                />
              </div>
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? t('login.verifying') : t('login.verifyButton')}
              </button>
            </form>
          )}

          {TELEGRAM_BOT_USERNAME && (
            <a
              href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=login`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300"
            >
              {t('login.botLink')}
            </a>
          )}

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
