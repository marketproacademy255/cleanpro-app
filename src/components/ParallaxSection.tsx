import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface ParallaxSectionProps {
  children: ReactNode
  bgImage?: string
  overlayGradient?: string
  className?: string
  speed?: number // Speed multiplier for parallax (e.g. -50 to 50)
}

export default function ParallaxSection({
  children,
  bgImage,
  overlayGradient = 'from-brand-900 via-brand-900/85 to-brand-900/50',
  className = '',
  speed = 40,
}: ParallaxSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], [`-${speed}%`, `${speed}%`])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6])

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {bgImage && (
        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            src={bgImage}
            alt="Parallax background"
            style={{ y: bgY, scale: 1.15 }}
            className="h-full w-full object-cover"
          />
          {overlayGradient && (
            <div className={`absolute inset-0 bg-gradient-to-r ${overlayGradient}`} />
          )}
        </div>
      )}

      <motion.div style={{ opacity }} className="relative z-10">
        {children}
      </motion.div>
    </div>
  )
}
