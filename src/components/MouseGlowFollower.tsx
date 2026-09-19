import { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function MouseGlowFollower() {
  const mouseX = useMotionValue(-200)
  const mouseY = useMotionValue(-200)

  const springConfig = { damping: 25, stiffness: 180, mass: 0.5 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  useEffect(() => {
    // Only activate on devices with fine pointer (desktop / laptop mice)
    if (window.matchMedia('(pointer: coarse)').matches) return

    function handleMouseMove(e: MouseEvent) {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      <motion.div
        className="absolute h-96 w-96 rounded-full bg-gradient-to-r from-emerald-500/15 via-teal-400/10 to-brand-500/15 blur-3xl dark:from-emerald-400/20 dark:to-teal-500/15"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
    </motion.div>
  )
}
