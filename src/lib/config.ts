// Flip to false once the business is live with real services, real
// payment gateways and this is no longer a demo/test deployment.
export const IS_DEMO = true

// Username of the Telegram registration bot (without the @), e.g. "cleanpro_uz_bot".
// Set VITE_TELEGRAM_BOT_USERNAME in Netlify env vars once the bot is created
// and its username is known (BotFather -> /mybots -> bot -> username).
export const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? ''
