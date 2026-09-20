import React, { useState, useRef, useCallback } from 'react'

export const BeforeAfterSlider: React.FC<{
  beforeImg: string
  afterImg: string
  beforeLabel?: string
  afterLabel?: string
}> = ({
  beforeImg,
  afterImg,
  beforeLabel = 'Oldin',
  afterLabel = 'Keyin',
}) => {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const updateSliderPos = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    let percentage = (x / rect.width) * 100
    if (percentage < 0) percentage = 0
    if (percentage > 100) percentage = 100
    setSliderPos(percentage)
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    updateSliderPos(e.clientX)
    const onPointerMove = (moveEv: PointerEvent) => {
      updateSliderPos(moveEv.clientX)
    }
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative w-full aspect-[16/10] sm:aspect-video rounded-3xl overflow-hidden select-none shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 cursor-ew-resize group"
    >
      {/* After image (base clean background layer) */}
      <img
        src={afterImg}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute top-4 right-4 z-20 rounded-full bg-emerald-500/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white shadow-lg flex items-center gap-1.5">
        <span>✨</span> {afterLabel}
      </div>

      {/* Before image layer with clip-path (no squishing or distortion) */}
      <img
        src={beforeImg}
        alt={beforeLabel}
        className="absolute inset-0 w-full h-full object-cover z-10"
        style={{
          clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
        }}
        loading="lazy"
      />
      <div
        className="absolute top-4 left-4 z-20 rounded-full bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white shadow-lg flex items-center gap-1.5 transition-opacity"
        style={{ opacity: sliderPos > 15 ? 1 : 0 }}
      >
        <span>🧹</span> {beforeLabel}
      </div>

      {/* Invisible range slider input for accessibility */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
        aria-label="Oldin va keyin taqqoslash slayderi"
      />

      {/* Vertical handle line & control knob */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] pointer-events-none z-20"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 bg-white dark:bg-slate-900 rounded-full shadow-2xl flex items-center justify-center border-2 border-emerald-500 group-hover:scale-110 transition-transform">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default BeforeAfterSlider
