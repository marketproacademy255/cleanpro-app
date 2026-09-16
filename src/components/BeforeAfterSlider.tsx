import React, { useState } from 'react'

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

  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-video rounded-3xl overflow-hidden select-none shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900">
      {/* After image (base background layer) */}
      <img
        src={afterImg}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute top-4 right-4 z-20 rounded-full bg-emerald-500/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-lg">
        ✨ {afterLabel}
      </div>

      {/* Before image (clipped overlay layer) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeImg}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover max-w-none"
          style={{ width: '100%', height: '100%' }}
          loading="lazy"
        />
        <div className="absolute top-4 left-4 z-20 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-lg">
          🧹 {beforeLabel}
        </div>
      </div>

      {/* Invisible range input slider */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
        aria-label="Oldin va keyin taqqoslash slayderi"
      />

      {/* Vertical handle line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] pointer-events-none z-20"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 bg-white dark:bg-slate-900 dark:text-white rounded-full shadow-xl flex items-center justify-center text-sm font-bold text-slate-700 border-2 border-brand-500 transition-transform hover:scale-110">
          ↔
        </div>
      </div>
    </div>
  )
}

export default BeforeAfterSlider
