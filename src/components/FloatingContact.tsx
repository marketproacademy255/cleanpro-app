import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowLeft, Bot, MessageCircle, Phone, Send, Sparkles, X } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { COMPANY_PHONE_DISPLAY, COMPANY_PHONE_TEL, COMPANY_WHATSAPP_NUMBER, TELEGRAM_BOT_USERNAME } from '@/lib/config'
import { useTranslation } from '@/context/LanguageContext'

const HIDDEN_PREFIXES = ['/kirish', '/royxatdan-otish', '/admin']

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Once the OpenRouter key isn't configured (netlify/functions/ai-chat.ts
// returns 503), don't keep hammering the endpoint on every message in
// this session - fall back to the plain contact links right away.
let aiUnavailable = false

function AiChat() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: t('floatingContact.aiGreeting') }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(aiUnavailable)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, loading])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const { reply } = await apiFetch<{ reply: string }>('ai-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(-8),
        }),
      })
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        aiUnavailable = true
        setUnavailable(true)
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: t('floatingContact.aiError') }])
      }
    } finally {
      setLoading(false)
    }
  }

  if (unavailable) {
    return <div className="p-4 text-sm text-gray-500 dark:text-gray-400">{t('floatingContact.aiUnavailable')}</div>
  }

  return (
    <div className="flex h-80 flex-col">
      <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-700 dark:bg-brand-900/40 dark:text-gray-200'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-400 dark:bg-brand-900/40">
              {t('floatingContact.aiSending')}
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-100 p-2 dark:border-gray-800">
        <input
          className="input py-2 text-sm"
          placeholder={t('floatingContact.aiPlaceholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label={t('floatingContact.aiSend')}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

export default function FloatingContact() {
  const [view, setView] = useState<'closed' | 'menu' | 'chat'>('closed')
  const { pathname } = useLocation()
  const { t } = useTranslation()
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null

  const panelOpen = view !== 'closed'

  return (
    // bottom-24 clears the mobile booking bar (h-11 + padding); md:bottom-6
    // once that bar is hidden on desktop.
    <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      {panelOpen && (
        <div className="w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-[#101c17] sm:w-80">
          {view === 'menu' ? (
            <div className="p-2">
              <a
                href={`https://wa.me/${COMPANY_WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-brand-900/40"
              >
                <MessageCircle className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                {t('floatingContact.whatsapp')}
              </a>
              {TELEGRAM_BOT_USERNAME && (
                <a
                  href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-brand-900/40"
                >
                  <Send className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  {t('floatingContact.telegram')}
                </a>
              )}
              <a
                href={`tel:${COMPANY_PHONE_TEL}`}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-brand-900/40"
              >
                <Phone className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                {COMPANY_PHONE_DISPLAY}
              </a>
              <hr className="my-1 border-gray-100 dark:border-gray-800" />
              <button
                type="button"
                onClick={() => setView('chat')}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-brand-900/40"
              >
                <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                {t('floatingContact.aiChat')}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  aria-label={t('floatingContact.back')}
                  className="grid h-7 w-7 place-items-center rounded-md text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-900/40"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <Bot className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('floatingContact.aiTitle')}</span>
              </div>
              <AiChat />
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setView((v) => (v === 'closed' ? 'menu' : 'closed'))}
        aria-label={panelOpen ? t('floatingContact.close') : t('floatingContact.open')}
        className="grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700"
      >
        {panelOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  )
}
