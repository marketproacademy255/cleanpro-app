import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Crosshair, MapPin, Loader2, Check, ExternalLink } from 'lucide-react'

interface MapLocationPickerProps {
  city?: string
  initialAddress?: string
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void
}

const CITY_COORDS: Record<string, [number, number]> = {
  Toshkent: [41.2995, 69.2401],
  Samarqand: [39.6542, 66.9597],
  'Ташкент': [41.2995, 69.2401],
  'Самарканд': [39.6542, 66.9597],
  Tashkent: [41.2995, 69.2401],
  Samarkand: [39.6542, 66.9597],
}

// Custom SVG marker pin icon to avoid broken image asset paths
const customIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 36px; height: 36px; background-color: rgba(16, 185, 129, 0.25); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 28px; height: 28px; background-color: #059669; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

export default function MapLocationPicker({ city = 'Toshkent', initialAddress = '', onLocationSelect }: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const defaultCenter = CITY_COORDS[city] || CITY_COORDS['Toshkent']
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultCenter[0],
    lng: defaultCenter[1],
  })
  const [addressText, setAddressText] = useState(initialAddress)
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapRef.current) return

    const initialCoords = CITY_COORDS[city] || CITY_COORDS['Toshkent']

    const map = L.map(mapContainerRef.current, {
      center: initialCoords,
      zoom: 14,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker(initialCoords, {
      draggable: true,
      icon: customIcon,
    }).addTo(map)

    markerRef.current = marker
    mapRef.current = map

    // Handle marker drag end
    marker.on('dragend', () => {
      const latLng = marker.getLatLng()
      updateLocation(latLng.lat, latLng.lng)
    })

    // Handle click on map
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      updateLocation(e.latlng.lat, e.latlng.lng)
    })

    // Initial reverse geocode
    updateLocation(initialCoords[0], initialCoords[1])

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  // Update map center when city selection changes
  useEffect(() => {
    const targetCenter = CITY_COORDS[city] || CITY_COORDS['Toshkent']
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView(targetCenter, 14)
      markerRef.current.setLatLng(targetCenter)
      updateLocation(targetCenter[0], targetCenter[1])
    }
  }, [city])

  // Reverse geocode via OpenStreetMap Nominatim
  async function updateLocation(lat: number, lng: number) {
    setCoords({ lat, lng })
    setGeocoding(true)
    setConfirmed(false)

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.display_name) {
          const parts = data.display_name.split(', ')
          // Keep first 4 main parts for cleaner address string
          const formatted = parts.slice(0, 4).join(', ')
          setAddressText(formatted)
          onLocationSelect({ address: formatted, lat, lng })
        } else {
          const fallback = `${city}, (${lat.toFixed(5)}, ${lng.toFixed(5)})`
          setAddressText(fallback)
          onLocationSelect({ address: fallback, lat, lng })
        }
      }
    } catch {
      const fallback = `${city}, (${lat.toFixed(5)}, ${lng.toFixed(5)})`
      setAddressText(fallback)
      onLocationSelect({ address: fallback, lat, lng })
    } finally {
      setGeocoding(false)
    }
  }

  // Handle current GPS location
  function handleUseGPS() {
    if (!navigator.geolocation) {
      alert("Qurilmangizda geolokatsiya qo'llab-quvvatlanmaydi.")
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 16)
          markerRef.current.setLatLng([lat, lng])
        }
        updateLocation(lat, lng)
        setLocating(false)
      },
      (err) => {
        console.error(err)
        alert("Joylashuvingizni aniqlashga ruxsat berilmadi yoki xatolik yuz berdi.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/30 p-3.5 dark:border-brand-900/40 dark:bg-brand-900/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900 dark:text-gray-100">
          <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <span>Xaritadan aniq manzilingizni belgilang:</span>
        </div>
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-brand-700 shadow-sm transition hover:bg-brand-50 disabled:opacity-50 dark:bg-gray-800 dark:text-brand-400 dark:hover:bg-gray-700"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
          <span>Joriy joylashuvim</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="relative h-56 w-full overflow-hidden rounded-lg border border-gray-200 shadow-inner dark:border-gray-700">
        <div ref={mapContainerRef} className="h-full w-full z-0" />
        <div className="absolute bottom-2 left-2 z-[1000] rounded bg-white/90 px-2 py-1 text-[11px] font-mono text-gray-600 shadow backdrop-blur dark:bg-gray-900/90 dark:text-gray-300">
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </div>
      </div>

      {/* Address Text Preview */}
      <div className="rounded-lg bg-white p-3 border border-gray-100 dark:border-gray-800 dark:bg-gray-800/80">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Xaritadan aniqlangan manzil:</div>
        <div className="mt-1 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {geocoding ? (
              <span className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-normal">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Manzil aniqlanmoqda…
              </span>
            ) : (
              addressText || `${city}, Koordinata: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
            )}
          </p>
          {!geocoding && (
            <button
              type="button"
              onClick={() => setConfirmed(true)}
              className={`shrink-0 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                confirmed
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              <Check className="h-3 w-3" />
              {confirmed ? 'Manzil tasdiqlandi' : 'Shu manzilni tanlash'}
            </button>
          )}
        </div>
        <div className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-between">
          <span>💡 Xaritadagi belgini surib yoki istalgan nuqtaga bosib aniqroq joyni tanlashingiz mumkin.</span>
          <a
            href={`https://yandex.uz/maps/?pt=${coords.lng},${coords.lat}&z=17&l=map`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-brand-600 hover:underline dark:text-brand-400"
          >
            Yandex Maps <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
