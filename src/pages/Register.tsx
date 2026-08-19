import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { TELEGRAM_BOT_USERNAME } from '@/lib/config'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: signUpError } = await signUp(email, password, fullName, phone)
    setLoading(false)
    if (signUpError) {
      setError(signUpError)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/kirish'), 1500)
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80"
          alt="Tozalangan yorug' xona"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/40 to-brand-900/10" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-2xl font-semibold leading-snug">
            Bir necha daqiqada ro'yxatdan o'ting va birinchi buyurtmangizni band qiling.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-14 sm:px-6">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">Ro'yxatdan o'tish</h1>
        {done ? (
          <p className="mt-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
            Muvaffaqiyatli ro'yxatdan o'tdingiz! Kirish sahifasiga yo'naltirilmoqda…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">To'liq ism</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Telefon raqam</label>
              <input className="input" placeholder="+998 90 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Parol</label>
              <input type="password" minLength={6} className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Yuborilmoqda…' : "Ro'yxatdan o'tish"}
            </button>
          </form>
        )}

        {TELEGRAM_BOT_USERNAME && !done && (
          <a
            href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=signup`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
          >
            Telegram orqali ro'yxatdan o'tish
          </a>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Hisobingiz bormi?{' '}
          <Link to="/kirish" className="font-medium text-brand-700">
            Kirish
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}
