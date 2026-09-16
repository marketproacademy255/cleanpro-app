import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface NotificationRaw {
  id: string
  city: Record<string, string>
  district: Record<string, string>
  name: string
  service: Record<string, string>
  minutesAgo: number
}

const SAMPLE_NOTIFICATIONS: NotificationRaw[] = [
  {
    id: '1',
    city: { uz: 'Toshkent', en: 'Tashkent', ru: 'Ташкент' },
    district: { uz: 'Yunusobod', en: 'Yunusabad', ru: 'Юнусабад' },
    name: 'Jamshid',
    service: { uz: 'Standart tozalash', en: 'Standard Cleaning', ru: 'Стандартная уборка' },
    minutesAgo: 2,
  },
  {
    id: '2',
    city: { uz: 'Toshkent', en: 'Tashkent', ru: 'Ташкент' },
    district: { uz: 'Mirzo Ulugʼbek', en: 'Mirzo Ulugbek', ru: 'Мирзо Улугбек' },
    name: 'Malika',
    service: { uz: 'Mukammal (Deep Clean)', en: 'Deep Cleaning', ru: 'Генеральная уборка' },
    minutesAgo: 5,
  },
  {
    id: '3',
    city: { uz: 'Samarqand', en: 'Samarkand', ru: 'Самарканд' },
    district: { uz: 'Markaz', en: 'Center', ru: 'Центр' },
    name: 'Sardor',
    service: { uz: "Ko'chib kirish tozalashi", en: 'Move-in Cleaning', ru: 'Уборка при переезде' },
    minutesAgo: 12,
  },
  {
    id: '4',
    city: { uz: 'Toshkent', en: 'Tashkent', ru: 'Ташкент' },
    district: { uz: 'Chilonzor', en: 'Chilanzar', ru: 'Чиланзар' },
    name: 'Dilnoza',
    service: { uz: 'Standart tozalash', en: 'Standard Cleaning', ru: 'Стандартная уборка' },
    minutesAgo: 18,
  },
  {
    id: '5',
    city: { uz: 'Toshkent', en: 'Tashkent', ru: 'Ташкент' },
    district: { uz: 'Yakkasaroy', en: 'Yakkasaray', ru: 'Яккасарай' },
    name: 'Anvar',
    service: { uz: 'Mukammal (Deep Clean)', en: 'Deep Cleaning', ru: 'Генеральная уборка' },
    minutesAgo: 25,
  },
]

export default function LiveNotification() {
  const { lang } = useTranslation()
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed) return

    // Show initial notification after 6 seconds
    const initialTimer = setTimeout(() => {
      setVisible(true)
    }, 6000)

    // Hide after 6 seconds, cycle every 32 seconds
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % SAMPLE_NOTIFICATIONS.length)
        setVisible(true)
      }, 1000)
    }, 32000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [dismissed])

  // Automatically hide notification card 7 seconds after it appears
  useEffect(() => {
    if (visible) {
      const hideTimer = setTimeout(() => {
        setVisible(false)
      }, 7000)
      return () => clearTimeout(hideTimer)
    }
  }, [visible])

  if (dismissed) return null

  const raw = SAMPLE_NOTIFICATIONS[index]
  const currentCity = raw.city[lang] || raw.city.uz
  const currentDistrict = raw.district[lang] || raw.district.uz
  const currentService = raw.service[lang] || raw.service.uz

  const actionText = lang === 'en' ? 'just booked' : lang === 'ru' ? 'забронировал(а)' : 'bron qildi'
  const timeAgoText = lang === 'en' ? `${raw.minutesAgo} minutes ago` : lang === 'ru' ? `${raw.minutesAgo} мин. назад` : `${raw.minutesAgo} daqiqa oldin`
  const closeAria = lang === 'en' ? 'Close' : lang === 'ru' ? 'Закрыть' : 'Yopish'

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-sm pointer-events-auto md:bottom-6">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative flex items-center gap-3.5 rounded-2xl border border-emerald-500/20 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-emerald-500/30 dark:bg-slate-900/95"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div className="flex-1 text-xs">
              <div className="font-semibold text-slate-900 dark:text-white">
                {currentCity}, {currentDistrict}: <span className="font-normal">{raw.name}</span>
              </div>
              <div className="mt-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                "{currentService}" <span className="text-slate-500 dark:text-slate-400">{actionText}</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                ⚡ {timeAgoText}
              </div>
            </div>

            <button
              onClick={() => {
                setVisible(false)
                setDismissed(true)
              }}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label={closeAria}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
