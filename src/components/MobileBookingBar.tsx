import { Link, useLocation } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { COMPANY_PHONE_TEL } from '@/lib/config'
import { useTranslation } from '@/context/LanguageContext'

// Pages where a sticky "book now" bar would be redundant or get in the way
// of another primary action (the booking form itself, auth forms, the
// customer/admin dashboards). Exported so App.tsx can add matching
// bottom-padding only on the pages where the bar actually renders.
export const MOBILE_BAR_HIDDEN_PREFIXES = ['/booking', '/login', '/register', '/dashboard', '/admin']

export default function MobileBookingBar() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  if (MOBILE_BAR_HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-gray-200 bg-white/95 px-3 py-2.5 backdrop-blur dark:border-gray-800 dark:bg-[#101c17]/95 md:hidden">
      <a
        href={`tel:${COMPANY_PHONE_TEL}`}
        aria-label={t('mobileBar.call')}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
      >
        <Phone className="h-5 w-5" />
      </a>
      <Link to="/booking" className="btn-primary h-11 flex-1">
        {t('mobileBar.book')}
      </Link>
    </div>
  )
}
