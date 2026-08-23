import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'

const STORAGE_KEY = 'cleanpro_promo_dismissed_v1'

/**
 * First-order promo banner. Kept honest about how it works: there's no
 * automated checkout discount wired up in the pricing engine yet, so this
 * asks the visitor to mention the promo code in the booking notes and our
 * team applies it manually before payment - same as how many local
 * businesses actually run promo codes. If/when a real automatic discount
 * is added to calculatePrice()/the backend, this copy should be updated
 * to say so.
 */
export default function DiscountBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  })

  if (dismissed) return null

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="bg-brand-700 text-white">
      <div className="section flex items-center justify-between gap-3 py-2.5 text-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            Birinchi buyurtmangizga <strong>-20%</strong> — band qilishda izohga{' '}
            <strong>YANGI20</strong> promo-kodini yozing.{' '}
            <Link to="/band-qilish" className="underline underline-offset-2 hover:text-brand-100">
              Hoziroq band qiling
            </Link>
          </span>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Yopish"
          className="shrink-0 rounded-md p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
