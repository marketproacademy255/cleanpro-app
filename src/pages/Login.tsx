import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signInWithCustomToken } from 'firebase/auth'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebaseClient'
import { apiFetch, ApiError } from '@/lib/api'
import { TELEGRAM_BOT_USERNAME } from '@/lib/config'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string; message?: string } }
  const [mode, setMode] = useState<'email' | 'telegram'>('email')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // --- Telegram phone+password+code flow ---
  const [tgStep, setTgStep] = useState<'credentials' | 'code'>('credentials')
  const [tgPhone, setTgPhone] = useState('')
  const [tgPassword, setTgPassword] = useState('')
  const [tgCode, setTgCode] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: signInError } = await signIn(email, password)
    setLoading(false)
    if (signInError) {
      setError(signInError)
      return
    }
    navigate(location.state?.from ?? '/kabinet')
  }

  async function requestTelegramCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiFetch('telegram-login-request', {
        method: 'POST',
        body: JSON.stringify({ phone: tgPhone, password: tgPassword }),
      })
      setTgStep('code')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kod yuborilmadi. Qaytadan urinib ko'ring.")
    } finally {
      setLoading(false)
    }
  }

  async function verifyTelegramCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!auth) throw new Error("Xizmat hozircha mavjud emas.")
      const { token } = await apiFetch<{ token: string }>('telegram-login-verify', {
        method: 'POST',
        body: JSON.stringify({ phone: tgPhone, code: tgCode }),
      })
      await signInWithCustomToken(auth, token)
      navigate(location.state?.from ?? '/kabinet')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error && err.message
            ? err.message
            : "Tasdiqlanmadi. Qaytadan urinib ko'ring.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1647381518264-97ff1835026f?auto=format&fit=crop&w=1200&q=80"
          alt="Xizmatchi uyni tozalamoqda"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/40 to-brand-900/10" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-2xl font-semibold leading-snug">
            Onlayn band qiling, xavfsiz to'lang — tekshirilgan xizmatchimiz eshigingizga keladi.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-14 sm:px-6">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">Tizimga kirish</h1>
        {location.state?.message && (
          <p className="mt-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{location.state.message}</p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => { setMode('email'); setError(null) }}
            className={`rounded-md py-2 text-sm font-medium transition ${mode === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => { setMode('telegram'); setError(null) }}
            className={`rounded-md py-2 text-sm font-medium transition ${mode === 'telegram' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Telegram
          </button>
        </div>

        {mode === 'email' ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Parol</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Kirilmoqda…' : 'Kirish'}
            </button>
          </form>
        ) : tgStep === 'credentials' ? (
          <form onSubmit={requestTelegramCode} className="mt-6 space-y-4">
            <p className="text-xs text-gray-500">
              Telegram bot orqali ro'yxatdan o'tgan telefon raqam va parolingizni kiriting — botga tasdiqlash kodi yuboriladi.
            </p>
            <div>
              <label className="label">Telefon raqam</label>
              <input className="input" placeholder="+998 90 123 45 67" value={tgPhone} onChange={(e) => setTgPhone(e.target.value)} required />
            </div>
            <div>
              <label className="label">Parol</label>
              <input type="password" className="input" value={tgPassword} onChange={(e) => setTgPassword(e.target.value)} required />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Yuborilmoqda…' : 'Telegramga kod yuborish'}
            </button>
            {TELEGRAM_BOT_USERNAME && (
              <a
                href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=signup`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-brand-700"
              >
                Hali ro'yxatdan o'tmaganmisiz? Telegram bot orqali ro'yxatdan o'ting
              </a>
            )}
          </form>
        ) : (
          <form onSubmit={verifyTelegramCode} className="mt-6 space-y-4">
            <p className="text-xs text-gray-500">Telegram botga yuborilgan 6 xonali kodni kiriting.</p>
            <div>
              <label className="label">Kod</label>
              <input className="input text-center text-lg tracking-widest" maxLength={6} value={tgCode} onChange={(e) => setTgCode(e.target.value)} required />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
            </button>
            <button type="button" onClick={() => setTgStep('credentials')} className="w-full text-center text-xs text-gray-400">
              Orqaga
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Hisobingiz yo'qmi?{' '}
          <Link to="/royxatdan-otish" className="font-medium text-brand-700">
            Ro'yxatdan o'ting
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}
