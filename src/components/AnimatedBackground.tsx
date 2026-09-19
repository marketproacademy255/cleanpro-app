import { motion } from 'framer-motion'

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Floating ambient glow blob 1 */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/20"
      />

      {/* Floating ambient glow blob 2 */}
      <motion.div
        animate={{
          x: [0, -35, 25, 0],
          y: [0, 35, -30, 0],
          scale: [1, 0.9, 1.2, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/20"
      />

      {/* Floating ambient glow blob 3 */}
      <motion.div
        animate={{
          x: [0, 20, -30, 0],
          y: [0, -25, 35, 0],
          scale: [1, 1.1, 0.85, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-400/20"
      />
    </div>
  )
}
