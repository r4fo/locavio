import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Badge from '@/components/ui/Badge'
import { sanitizeText } from '@/utils/sanitize'

const STATUS_VARIANT = {
  draft: 'muted',
  upcoming: 'default',
  active: 'success',
  completed: 'muted',
  wishlist: 'warning',
}

function ItineraryCard({ itinerary }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/itineraries/${itinerary.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/itineraries/${itinerary.id}`)}
      className="card cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-espresso text-base leading-snug line-clamp-2">
          {sanitizeText(itinerary.title) || t('common.empty')}
        </h3>
        {itinerary.generated_by_ai && (
          <span className="shrink-0">
            <Badge variant="default">
              <Sparkles size={11} className="inline mr-1" />
              {t('itinerary.ai_badge')}
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={STATUS_VARIANT[itinerary.status] || 'muted'}>
          {t(`itinerary.status.${itinerary.status}`)}
        </Badge>
        <Badge variant="muted">
          {t(`itinerary.purpose.${itinerary.purpose}`)}
        </Badge>
      </div>

      <div className="flex flex-col gap-1 text-sm text-muted">
        {itinerary.location && (
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="shrink-0" />
            {sanitizeText(itinerary.location)}
          </span>
        )}
        {itinerary.date && (
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="shrink-0" />
            {itinerary.date}
          </span>
        )}
      </div>
    </div>
  )
}

ItineraryCard.propTypes = {
  itinerary: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string,
    location: PropTypes.string,
    date: PropTypes.string,
    status: PropTypes.string,
    purpose: PropTypes.string,
    generated_by_ai: PropTypes.bool,
  }).isRequired,
}

export default ItineraryCard
