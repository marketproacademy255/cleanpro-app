import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { COMPANY_EMAIL, COMPANY_PHONE_DISPLAY } from '@/lib/config'
import { useTranslation } from '@/context/LanguageContext'

export default function Contact() {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      await apiFetch('contact', { method: 'POST', body: JSON.stringify({ name, contact, message }) })
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('contact.error'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="section max-w-xl py-14">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('contact.title')}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{t('contact.desc')}</p>

      <div className="card mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2.5">
          <Phone className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
          {COMPANY_PHONE_DISPLAY}
        </div>
        <div className="flex items-center gap-2.5">
          <Mail className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
          {COMPANY_EMAIL}
        </div>
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
          {t('contact.address')}
        </div>
      </div>

      {sent ? (
        <div className="card mt-6 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">{t('contact.sentMessage')}</div>
      ) : (
        <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
          <div>
            <label className="label">{t('contact.nameLabel')}</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t('contact.contactLabel')}</label>
            <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t('contact.messageLabel')}</label>
            <textarea className="input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={sending} className="btn-primary w-full">
            {sending ? t('contact.sending') : t('contact.send')}
          </button>
        </form>
      )}
    </div>
  )
}
