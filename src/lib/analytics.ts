import { GA_MEASUREMENT_ID } from './config'

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

/**
 * Loads Google Analytics 4 only if VITE_GA_MEASUREMENT_ID is set. Safe to
 * call unconditionally at startup - a missing/unset ID (the default, e.g.
 * local dev with no .env) means this is a no-op, matching the rest of the
 * app's "still works with zero backend/analytics config" behavior.
 */
export function initAnalytics(): void {
  if (!GA_MEASUREMENT_ID || typeof document === 'undefined') return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
}
