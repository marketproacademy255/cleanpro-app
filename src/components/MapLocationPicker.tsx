import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Crosshair, MapPin, Loader2, Check, Search, AlertCircle, Building } from 'lucide-react'

export interface LocationDetails {
  address: string
  lat: number
  lng: number
  apartment?: string
  floor?: string
  entrance?: string
  intercom?: string
  landmark?: string
}

interface MapLocationPickerProps {
  city?: string
  initialAddress?: string
  initialDetails?: Partial<LocationDetails>
  onLocationSelect: (location: LocationDetails) => void
}

const CITY_COORDS: Record<string, [number, number]> = {
  Toshkent: [41.2995, 69.2401],
  Samarqand: [39.6542, 66.9597],
  Namangan: [40.9983, 71.6726],
  Andijon: [40.7821, 72.3442],
  "Farg'ona": [40.3842, 71.7843],
  Fergana: [40.3842, 71.7843],
  Buxoro: [39.7747, 64.4286],
  Bukhara: [39.7747, 64.4286],
  Xiva: [41.3783, 60.3639],
  Khiva: [41.3783, 60.3639],
  Nukus: [42.4603, 59.6166],
  Qarshi: [38.8606, 65.7892],
  Karshi: [38.8606, 65.7892],
  Termiz: [37.2242, 67.2783],
  Termez: [37.2242, 67.2783],
  Navoiy: [40.0844, 65.3792],
  Navoi: [40.0844, 65.3792],
  Jizzax: [40.1158, 67.8422],
  Jizzakh: [40.1158, 67.8422],
  Guliston: [40.4897, 68.7842],
  'Ташкент': [41.2995, 69.2401],
  'Самарканд': [39.6542, 66.9597],
  Tashkent: [41.2995, 69.2401],
  Samarkand: [39.6542, 66.9597],
}

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

interface SearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export default function MapLocationPicker({
  city = 'Toshkent',
  initialAddress = '',
  initialDetails = {},
  onLocationSelect,
}: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const defaultCenter = CITY_COORDS[city] || CITY_COORDS['Toshkent']
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialDetails?.lat || defaultCenter[0],
    lng: initialDetails?.lng || defaultCenter[1],
  })
  const [addressText, setAddressText] = useState(initialAddress)

  // Building detail inputs
  const [apartment, setApartment] = useState(initialDetails.apartment || '')
  const [floor, setFloor] = useState(initialDetails.floor || '')
  const [entrance, setEntrance] = useState(initialDetails.entrance || '')
  const [intercom, setIntercom] = useState(initialDetails.intercom || '')
  const [landmark, setLandmark] = useState(initialDetails.landmark || '')

  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Helper to emit complete location details payload
  function notifyChange(address: string, lat: number, lng: number, overrides = {}) {
    onLocationSelect({
      address,
      lat,
      lng,
      apartment,
      floor,
      entrance,
      intercom,
      landmark,
      ...overrides,
    })
  }

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapRef.current) return

    const initialCoords: [number, number] = [coords.lat, coords.lng]

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

    setTimeout(() => {
      map.invalidateSize()
    }, 300)

    // Handle marker drag end
    marker.on('dragend', () => {
      const latLng = marker.getLatLng()
      updateLocation(latLng.lat, latLng.lng, true)
    })

    // Handle click on map
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      updateLocation(e.latlng.lat, e.latlng.lng, true)
    })

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
      setCoords({ lat: targetCenter[0], lng: targetCenter[1] })
    }
  }, [city])

  // Reverse geocode with Nominatim + BigDataCloud fallback
  async function updateLocation(lat: number, lng: number, notifyParent = true) {
    setCoords({ lat, lng })
    setGeocoding(true)
    setConfirmed(notifyParent)
    setGpsError(null)

    let formattedAddress = ''

    // Primary: OpenStreetMap Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`,
      )
      if (res.ok) {
        const data = await res.json()
        if (data && data.display_name) {
          const parts = data.display_name.split(', ')
          formattedAddress = parts.slice(0, 4).join(', ')
        }
      }
    } catch {
      // Ignore
    }

    // Secondary Fallback: BigDataCloud Reverse Geocoding
    if (!formattedAddress) {
      try {
        const res2 = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=uz`,
        )
        if (res2.ok) {
          const data2 = await res2.json()
          const parts = [
            data2.locality || data2.city,
            data2.principalSubdivision,
            data2.countryName,
          ].filter(Boolean)
          if (parts.length > 0) {
            formattedAddress = parts.join(', ')
          }
        }
      } catch {
        // Ignore
      }
    }

    if (!formattedAddress) {
      formattedAddress = `${city}, (${lat.toFixed(5)}, ${lng.toFixed(5)})`
    }

    setAddressText(formattedAddress)
    if (notifyParent) {
      notifyChange(formattedAddress, lat, lng)
    }
    setGeocoding(false)
  }

  // IP Geolocation Fallback
  async function fallbackToIPLocation(): Promise<boolean> {
    try {
      const res = await fetch('https://freeipapi.com/api/json')
      if (res.ok) {
        const data = await res.json()
        if (data.latitude && data.longitude) {
          const lat = data.latitude
          const lng = data.longitude
          if (mapRef.current && markerRef.current) {
            mapRef.current.flyTo([lat, lng], 15)
            markerRef.current.setLatLng([lat, lng])
          }
          await updateLocation(lat, lng, true)
          setGpsError(null)
          return true
        }
      }
    } catch {
      // try fallback 2
    }

    try {
      const res2 = await fetch('https://ipapi.co/json/')
      if (res2.ok) {
        const data2 = await res2.json()
        if (data2.latitude && data2.longitude) {
          const lat = data2.latitude
          const lng = data2.longitude
          if (mapRef.current && markerRef.current) {
            mapRef.current.flyTo([lat, lng], 15)
            markerRef.current.setLatLng([lat, lng])
          }
          await updateLocation(lat, lng, true)
          setGpsError(null)
          return true
        }
      }
    } catch {
      // ignore
    }

    return false
  }

  // Handle Search Input Change
  function handleSearchChange(q: string) {
    setSearchQuery(q)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (q.trim().length < 3) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            `${city} ${q}`,
          )}&countrycodes=uz&accept-language=uz&limit=5`,
        )
        if (res.ok) {
          const data: SearchResult[] = await res.json()
          setSearchResults(data)
        }
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)
  }

  // Handle selecting a search result
  function handleSelectResult(item: SearchResult) {
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)

    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo([lat, lng], 16)
      markerRef.current.setLatLng([lat, lng])
    }

    const parts = item.display_name.split(', ')
    const formatted = parts.slice(0, 4).join(', ')
    setAddressText(formatted)
    setCoords({ lat, lng })
    setSearchResults([])
    setSearchQuery('')
    setConfirmed(true)
    notifyChange(formatted, lat, lng)
  }

  // Auto-request location on mount if no initial address is set
  useEffect(() => {
    if (!initialAddress) {
      requestLocation(true)
    }
  }, [])

  // Core Geolocation Request Handler
  async function requestLocation(isAutoMount = false) {
    if (!navigator.geolocation) {
      if (!isAutoMount) {
        setGpsError("Qurilmangizda GPS qo'llab-quvvatlanmaydi.")
      }
      return
    }

    setLocating(true)
    setGpsError(null)

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        })
      })

      const lat = pos.coords.latitude
      const lng = pos.coords.longitude

      if (mapRef.current && markerRef.current) {
        mapRef.current.flyTo([lat, lng], 16)
        markerRef.current.setLatLng([lat, lng])
      }
      await updateLocation(lat, lng, true)
      setGpsError(null)
    } catch (err: any) {
      if (err && err.code === 1) {
        setGpsError(
          "Brauzerda joylashuvga ruxsat berilmadi (Blocked). Iltimos, brauzeringizda ushbu sayt uchun joylashuvga ruxsat bering yoki manzilni xaritadan tanlang.",
        )
      } else {
        const ipSuccess = await fallbackToIPLocation()
        if (!ipSuccess && !isAutoMount) {
          setGpsError(
            "GPS orqali joylashuvni aniqlab bo'lmadi. Iltimos, xaritadan belgilang.",
          )
        }
      }
    } finally {
      setLocating(false)
    }
  }

  function handleUseGPS() {
    requestLocation(false)
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/30 p-3.5 dark:border-brand-900/40 dark:bg-brand-900/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900 dark:text-gray-100">
          <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <span>Xaritadan manzilni belgilang:</span>
        </div>
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 disabled:opacity-50 dark:bg-gray-800 dark:text-brand-400 dark:hover:bg-gray-700"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
          <span>Joriy joylashuvim (GPS)</span>
        </button>
      </div>

      {gpsError && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Address Search Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={`${city} bo'ylab ko'cha, mahalla yoki mo'ljalni qidiring...`}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-xs text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <Search className="absolute left-2.5 h-4 w-4 text-gray-400" />
          {isSearching && <Loader2 className="absolute right-2.5 h-4 w-4 animate-spin text-brand-600" />}
        </div>

        {searchResults.length > 0 && (
          <div className="absolute z-[1000] mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {searchResults.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelectResult(item)}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-brand-50 dark:text-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-2"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                <span className="truncate">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative h-60 w-full overflow-hidden rounded-lg border border-gray-200 shadow-inner dark:border-gray-700">
        <div ref={mapContainerRef} className="h-full w-full z-0" />
        <div className="absolute bottom-2 left-2 z-[1000] rounded bg-white/90 px-2 py-1 text-[11px] font-mono text-gray-600 shadow backdrop-blur dark:bg-gray-900/90 dark:text-gray-300">
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </div>
      </div>

      {/* Address Text Preview */}
      <div className="rounded-lg bg-white p-3 border border-gray-100 dark:border-gray-800 dark:bg-gray-800/80">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Xaritadan aniqlangan ko'cha:</div>
        <div className="mt-1 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {geocoding ? (
              <span className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-normal">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Manzil aniqlanmoqda…
              </span>
            ) : addressText ? (
              addressText
            ) : (
              <span className="text-gray-400 font-normal text-xs">
                Xaritadagi nuqtaga bosing, belgini suring yoki yuqorida qidiring.
              </span>
            )}
          </p>
          {addressText && !geocoding && (
            <button
              type="button"
              onClick={() => {
                setConfirmed(true)
                notifyChange(addressText, coords.lat, coords.lng)
              }}
              className={`shrink-0 inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition ${
                confirmed
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              <Check className="h-3 w-3" />
              <span>{confirmed ? 'Tanlandi' : 'Tasdiqlash'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Detailed Building Input Fields */}
      <div className="rounded-lg bg-white p-3 border border-gray-100 space-y-3 dark:border-gray-800 dark:bg-gray-800/80">
        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5 text-brand-600" />
          <span>Aniq bino va xonadon ma'lumotlari:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400 block mb-1">Xonadon / Ofis</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={apartment}
                onChange={(e) => {
                  setApartment(e.target.value)
                  notifyChange(addressText, coords.lat, coords.lng, { apartment: e.target.value })
                }}
                placeholder="Masalan: 42"
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2.5 text-xs text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400 block mb-1">Qavat (Etaj)</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={floor}
                onChange={(e) => {
                  setFloor(e.target.value)
                  notifyChange(addressText, coords.lat, coords.lng, { floor: e.target.value })
                }}
                placeholder="Masalan: 5"
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2.5 text-xs text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400 block mb-1">Podyezd</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={entrance}
                onChange={(e) => {
                  setEntrance(e.target.value)
                  notifyChange(addressText, coords.lat, coords.lng, { entrance: e.target.value })
                }}
                placeholder="Masalan: 2"
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2.5 text-xs text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400 block mb-1">Domofon kodi</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={intercom}
                onChange={(e) => {
                  setIntercom(e.target.value)
                  notifyChange(addressText, coords.lat, coords.lng, { intercom: e.target.value })
                }}
                placeholder="Masalan: 42K"
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2.5 text-xs text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400 block mb-1">Mo'ljal (Orientir)</label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={landmark}
              onChange={(e) => {
                setLandmark(e.target.value)
                notifyChange(addressText, coords.lat, coords.lng, { landmark: e.target.value })
              }}
              placeholder="Masalan: Makro supermarketi ro'parasida, 4-maktab yonida"
              className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2.5 text-xs text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
