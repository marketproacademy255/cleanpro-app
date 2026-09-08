// Flip to false once the business is live with real services, real
// payment gateways and this is no longer a demo/test deployment.
export const IS_DEMO = true

// Brand name/tagline shown in the Navbar, Footer and page titles. Kept in
// one place so a future rename doesn't require hunting through every page.
// Per-language versions (Uzbek/English/Russian) live in src/i18n/translations.ts
// under the `brand` namespace - these two are the plain fallback used where
// translation context isn't available (e.g. non-React contexts).
export const COMPANY_NAME = 'Prime Standard & Co'
export const COMPANY_TAGLINE = 'Cleaning Services'

// Username of the Telegram registration bot (without the @), e.g. "primestandard_uz_bot".
// Set VITE_TELEGRAM_BOT_USERNAME in Netlify env vars once the bot is created
// and its username is known (BotFather -> /mybots -> bot -> username).
export const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? ''

// Same phone number shown everywhere else in the app (Navbar, Footer,
// Contact page) - kept here too so the WhatsApp deep link and mobile
// call-to-action bar always match it instead of drifting out of sync.
export const COMPANY_PHONE_DISPLAY = '+998 50 777 64 52'
export const COMPANY_PHONE_TEL = '+998507776452'
// wa.me expects digits only, no "+".
export const COMPANY_WHATSAPP_NUMBER = '998507776452'

// Branch locations with Yandex Maps coordinate links
export const BRANCH_LOCATIONS = [
  {
    id: 'tashkent',
    name_uz: 'Toshkent filiali',
    name_ru: 'Ташкентский филиал',
    name_en: 'Tashkent Branch',
    lat: 41.21928,
    lng: 69.21136,
    coordsText: '41.21928, 69.21136',
    yandexMapUrl: 'https://yandex.uz/maps/?pt=69.21136,41.21928&z=16&l=map',
  },
  {
    id: 'samarkand',
    name_uz: 'Samarqand filiali',
    name_ru: 'Самаркандский филиал',
    name_en: 'Samarkand Branch',
    lat: 39.66317,
    lng: 66.92439,
    coordsText: '39.66317, 66.92439',
    yandexMapUrl: 'https://yandex.uz/maps/?pt=66.92439,39.66317&z=16&l=map',
  },
]

// The live custom domain is cleaningpro.uz (registered via Eskiz, pointed
// at Netlify) - NOT cleanpro.uz. Previously the contact email and several
// meta tags were hardcoded to the wrong "cleanpro.uz" domain; kept here
// as one source of truth so that mistake can't creep back in.
export const COMPANY_EMAIL = 'info@cleaningpro.uz'

// Google Analytics 4 measurement ID (e.g. "G-XXXXXXXXXX"). Optional - if
// unset, src/lib/analytics.ts simply doesn't load anything.
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? ''
