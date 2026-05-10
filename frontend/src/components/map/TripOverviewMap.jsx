import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/store/uiStore'
import { createStatusPin } from './TripPin'

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
    }
  }, [bounds, map])
  return null
}

function MapResizer() {
  const map = useMap()
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)

  useEffect(() => {
    map.invalidateSize()
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [map])

  // Re-invalidate after sidebar slide transition (300 ms) completes
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 320)
    return () => clearTimeout(t)
  }, [sidebarOpen, map])

  return null
}

FitBounds.propTypes = {
  bounds: PropTypes.array,
}

function TripOverviewMap({ itineraries = [] }) {
  const { t } = useTranslation()

  const validItineraries = itineraries.filter(
    (it) => it.lat != null && it.lng != null
  )

  const bounds = validItineraries.map((it) => [it.lat, it.lng])
  const defaultCenter = [20, 0]
  const defaultZoom = validItineraries.length > 0 ? 5 : 2

  return (
    <div className="w-full max-w-full rounded-xl overflow-hidden shadow-sm border border-accent/20" style={{ height: 400 }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapResizer />
        {validItineraries.length > 0 && <FitBounds bounds={bounds} />}

        {validItineraries.map((it) => (
          <Marker
            key={it.id}
            position={[it.lat, it.lng]}
            icon={createStatusPin(it.status)}
          >
            <Popup>
              <div className="font-sans text-sm">
                <p className="font-semibold text-espresso mb-1">{it.title}</p>
                {it.date && <p className="text-muted text-xs mb-2">{it.date}</p>}
                <Link
                  to={`/itineraries/${it.id}`}
                  className="text-primary text-xs font-medium hover:underline"
                >
                  View itinerary →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

TripOverviewMap.propTypes = {
  itineraries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string,
      lat: PropTypes.number,
      lng: PropTypes.number,
      status: PropTypes.string,
      date: PropTypes.string,
    })
  ),
}

export default TripOverviewMap
