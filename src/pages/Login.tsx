import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string; message?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="section flex min-h-[70vh] items-center justify-center py-14">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">Tizimga kirish</h1>
        {location.state?.message && (
          <p className="mt-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{location.state.message}</p>
        )}
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
        <p className="mt-6 text-center text-sm text-gray-500">
          Hisobingiz yo'qmi?{' '}
          <Link to="/royxatdan-otish" className="font-medium text-brand-700">
            Ro'yxatdan o'ting
          </Link>
        </p>
      </div>
    </div>
  )
}
