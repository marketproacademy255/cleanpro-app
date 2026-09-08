import { useState, type FormEvent } from 'react'
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { BRANCH_LOCATIONS, COMPANY_EMAIL, COMPANY_PHONE_DISPLAY, COMPANY_PHONE_TEL } from '@/lib/config'
import { useTranslation } from '@/context/LanguageContext'

export default function Contact() {
  const { t, lang } = useTranslation()
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

      <div className="card mt-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <a href={`tel:${COMPANY_PHONE_TEL}`} className="flex items-center gap-2.5 hover:text-brand-700 dark:hover:text-brand-400 transition font-medium text-base text-gray-900 dark:text-gray-100">
          <Phone className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
          {COMPANY_PHONE_DISPLAY}
        </a>
        <a href={`mailto:${COMPANY_EMAIL}`} className="flex items-center gap-2.5 hover:text-brand-700 dark:hover:text-brand-400 transition">
          <Mail className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
          {COMPANY_EMAIL}
        </a>
        
        <hr className="my-3 border-gray-100 dark:border-gray-800" />
        
        <div className="space-y-3">
          <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Filiallarimiz (Yandex Maps):
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {BRANCH_LOCATIONS.map((b) => (
              <a
                key={b.id}
                href={b.yandexMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-gray-50 p-3.5 transition hover:border-brand-500 hover:bg-brand-50/50 dark:border-gray-700/80 dark:bg-gray-800/50 dark:hover:border-brand-500 dark:hover:bg-brand-900/20"
              >
                <div>
                  <div className="flex items-center justify-between font-semibold text-gray-900 group-hover:text-brand-700 dark:text-gray-100 dark:group-hover:text-brand-400">
                    <span>{lang === 'ru' ? b.name_ru : lang === 'en' ? b.name_en : b.name_uz}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-brand-600 dark:text-gray-500" />
                  </div>
                  <div className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                    {b.coordsText}
                  </div>
                </div>
                <span className="mt-2 text-xs font-medium text-brand-600 underline dark:text-brand-400">
                  Yandex Maps-da ochish ↗
                </span>
              </a>
            ))}
          </div>
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
