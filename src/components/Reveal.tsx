import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'zoom'

interface RevealProps {
  children: ReactNode
  delayMs?: number
  className?: string
  direction?: RevealDirection
  /** Distance in pixels to travel from left/right/up/down */
  distance?: number
  /** If true, animates only the first time into view. If false, re-animates on scroll up/down */
  once?: boolean
}

export default function Reveal({
  children,
  delayMs = 0,
  className = '',
  direction = 'up',
  distance = 90,
  once = false,
}: RevealProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: -distance, y: 0, opacity: 0, scale: 0.95 }
      case 'right':
        return { x: distance, y: 0, opacity: 0, scale: 0.95 }
      case 'up':
        return { x: 0, y: distance / 2, opacity: 0, scale: 0.98 }
      case 'down':
        return { x: 0, y: -distance / 2, opacity: 0, scale: 0.98 }
      case 'zoom':
        return { x: 0, y: 0, opacity: 0, scale: 0.85 }
      default:
        return { x: 0, y: distance / 2, opacity: 0, scale: 0.98 }
    }
  }

  return (
    <motion.div
      initial={getInitialPosition()}
      whileInView={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      viewport={{ once, margin: '-60px' }}
      transition={{
        duration: 0.7,
        delay: delayMs / 1000,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
