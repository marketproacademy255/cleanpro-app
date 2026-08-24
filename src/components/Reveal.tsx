import { useEffect, useRef, useState, type ReactNode } from 'react'

type RevealDirection = 'up' | 'left' | 'right'

interface RevealProps {
  children: ReactNode
  /** Stagger delay in ms - pass `index * 80` in a .map() for a cascading effect. */
  delayMs?: number
  className?: string
  /**
   * Which direction the element travels in from as it appears:
   * 'up' (default, slides up + fades), 'left' (slides in from the left +
   * fades) or 'right' (slides in from the right + fades). Useful for
   * alternating image/text blocks so content doesn't just fade in from a
   * single direction the whole way down the page.
   */
  direction?: RevealDirection
}

const HIDDEN_TRANSFORM: Record<RevealDirection, string> = {
  up: 'translate-y-6',
  left: '-translate-x-10',
  right: 'translate-x-10',
}

/**
 * Fades + slides an element into place the first time it scrolls into
 * view, instead of everything just being there instantly on load. Uses
 * IntersectionObserver (cheap, no scroll-listener math) and disconnects
 * once triggered - it only ever plays once per element, doesn't reverse
 * when scrolling back up. Respects prefers-reduced-motion by skipping the
 * animation entirely and just showing the content.
 */
export default function Reveal({ children, delayMs = 0, className = '', direction = 'up' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-x-0 translate-y-0 opacity-100' : `${HIDDEN_TRANSFORM[direction]} opacity-0`
      } ${className}`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
