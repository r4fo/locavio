import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import Badge from '@/components/ui/Badge'
import { useUiStore } from '@/store/uiStore'
import { createActivityPin } from './TripPin'

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
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

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 450)
    return () => clearTimeout(t)
  }, [sidebarOpen, map])

  return null
}

FitBounds.propTypes = { bounds: PropTypes.array }

function ItineraryDetailMap({ activities = [] }) {
  const { t } = useTranslation()

  const validActivities = activities
    .filter((a) => a.lat != null && a.lng != null)
    .sort((a, b) => a.order_index - b.order_index)

  if (validActivities.length === 0) {
    return (
      <div
        className="rounded-xl bg-card border border-accent/20 flex items-center justify-center text-muted text-sm"
        style={{ height: 350 }}
      >
        {t('common.empty')} — no coordinates yet
      </div>
    )
  }

  const bounds = validActivities.map((a) => [a.lat, a.lng])
  const polylinePositions = validActivities.map((a) => [a.lat, a.lng])

  return (
    <div className="w-full max-w-full rounded-xl overflow-hidden shadow-sm border border-accent/20" style={{ height: 350, transform: 'translateZ(0)', isolation: 'isolate' }}>
      <MapContainer
        center={bounds[0]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapResizer />
        <FitBounds bounds={bounds} />

        <Polyline
          positions={polylinePositions}
          pathOptions={{ color: '#A0522D', weight: 2, opacity: 0.7, dashArray: '6 4' }}
        />

        {validActivities.map((activity, idx) => (
          <Marker
            key={activity.id}
            position={[activity.lat, activity.lng]}
            icon={createActivityPin(idx, activity.category)}
          >
            <Popup>
              <div className="font-sans text-sm min-w-[160px]">
                <p className="font-semibold text-espresso mb-1">
                  {idx + 1}. {activity.title}
                </p>
                {activity.category && (
                  <span className="inline-block mb-1">
                    <Badge variant="default">{t(`activity.category.${activity.category}`)}</Badge>
                  </span>
                )}
                {activity.duration_minutes && (
                  <p className="text-muted text-xs">
                    {activity.duration_minutes} {t('activity.duration')}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

ItineraryDetailMap.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string,
      lat: PropTypes.number,
      lng: PropTypes.number,
      order_index: PropTypes.number,
      category: PropTypes.string,
      duration_minutes: PropTypes.number,
    })
  ),
}

export default ItineraryDetailMap
