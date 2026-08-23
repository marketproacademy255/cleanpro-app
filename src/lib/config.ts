// Flip to false once the business is live with real services, real
// payment gateways and this is no longer a demo/test deployment.
export const IS_DEMO = true

// Username of the Telegram registration bot (without the @), e.g. "cleanpro_uz_bot".
// Set VITE_TELEGRAM_BOT_USERNAME in Netlify env vars once the bot is created
// and its username is known (BotFather -> /mybots -> bot -> username).
export const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? ''

// Same phone number shown everywhere else in the app (Navbar, Footer,
// Contact page) - kept here too so the WhatsApp deep link and mobile
// call-to-action bar always match it instead of drifting out of sync.
export const COMPANY_PHONE_DISPLAY = '+998 90 111 22 33'
export const COMPANY_PHONE_TEL = '+998901112233'
// wa.me expects digits only, no "+".
export const COMPANY_WHATSAPP_NUMBER = '998901112233'

// Google Analytics 4 measurement ID (e.g. "G-XXXXXXXXXX"). Optional - if
// unset, src/lib/analytics.ts simply doesn't load anything.
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? ''
