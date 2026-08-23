import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircle, Phone, Send, X } from 'lucide-react'
import { COMPANY_PHONE_DISPLAY, COMPANY_PHONE_TEL, COMPANY_WHATSAPP_NUMBER, TELEGRAM_BOT_USERNAME } from '@/lib/config'

const HIDDEN_PREFIXES = ['/kirish', '/royxatdan-otish', '/admin']

export default function FloatingContact() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null

  return (
    // bottom-24 clears the mobile booking bar (h-11 + padding); md:bottom-6
    // once that bar is hidden on desktop.
    <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      {open && (
        <div className="w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <a
            href={`https://wa.me/${COMPANY_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <MessageCircle className="h-4 w-4 text-brand-600" />
            WhatsApp orqali yozing
          </a>
          {TELEGRAM_BOT_USERNAME && (
            <a
              href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Send className="h-4 w-4 text-brand-600" />
              Telegram orqali yozing
            </a>
          )}
          <a
            href={`tel:${COMPANY_PHONE_TEL}`}
            className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Phone className="h-4 w-4 text-brand-600" />
            {COMPANY_PHONE_DISPLAY}
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Bog'lanishni yopish" : "Biz bilan bog'laning"}
        className="grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  )
}
