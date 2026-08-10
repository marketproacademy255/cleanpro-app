import { useState, type FormEvent } from 'react'

export default function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="section max-w-xl py-14">
      <h1 className="text-3xl font-bold text-gray-900">Aloqa</h1>
      <p className="mt-2 text-gray-500">Savollaringiz bo'lsa, biz bilan bog'laning.</p>

      <div className="card mt-6 space-y-2 text-sm text-gray-600">
        <div>📞 +998 90 111 22 33</div>
        <div>✉️ info@cleanpro.uz</div>
        <div>📍 Toshkent, O'zbekiston</div>
      </div>

      {sent ? (
        <div className="card mt-6 bg-brand-50 text-brand-700">Xabaringiz uchun rahmat! Tez orada bog'lanamiz.</div>
      ) : (
        <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
          <div>
            <label className="label">Ism</label>
            <input className="input" required />
          </div>
          <div>
            <label className="label">Telefon yoki email</label>
            <input className="input" required />
          </div>
          <div>
            <label className="label">Xabar</label>
            <textarea className="input" rows={4} required />
          </div>
          <button type="submit" className="btn-primary w-full">Yuborish</button>
        </form>
      )}
    </div>
  )
}
