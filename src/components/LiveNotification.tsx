import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'

interface NotificationItem {
  id: string
  city: string
  district: string
  name: string
  service: string
  timeAgo: string
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', city: 'Toshkent', district: 'Yunusobod', name: 'Jamshid', service: 'Standart tozalash', timeAgo: '2 daqiqa oldin' },
  { id: '2', city: 'Toshkent', district: 'Mirzo Ulugʼbek', name: 'Malika', service: 'Mukammal (Deep Clean)', timeAgo: '5 daqiqa oldin' },
  { id: '3', city: 'Samarqand', district: 'Markaz', name: 'Sardor', service: 'Ko\'chib kirish tozalashi', timeAgo: '12 daqiqa oldin' },
  { id: '4', city: 'Toshkent', district: 'Chilonzor', name: 'Dilnoza', service: 'Standart tozalash', timeAgo: '18 daqiqa oldin' },
  { id: '5', city: 'Toshkent', district: 'Yakkasaroy', name: 'Anvar', service: 'Mukammal (Deep Clean)', timeAgo: '25 daqiqa oldin' },
]

export default function LiveNotification() {
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

  const current = SAMPLE_NOTIFICATIONS[index]

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
                {current.city}, {current.district}: <span className="font-normal">{current.name}</span>
              </div>
              <div className="mt-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                "{current.service}" <span className="text-slate-500 dark:text-slate-400">bron qildi</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                ⚡ {current.timeAgo}
              </div>
            </div>

            <button
              onClick={() => {
                setVisible(false)
                setDismissed(true)
              }}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Yopish"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
