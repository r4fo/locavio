import PropTypes from 'prop-types'
import { MapPin, Clock, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Badge from '@/components/ui/Badge'
import { sanitizeText } from '@/utils/sanitize'

function ActivityCard({ activity, onEdit, onDelete, showControls = false }) {
  const { t } = useTranslation()

  return (
    <div className="flex items-start gap-3 bg-card rounded-xl p-4 shadow-sm border border-accent/20">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
        {activity.order_index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-espresso text-sm leading-snug">
            {sanitizeText(activity.title)}
          </h4>
          {showControls && (
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <button
                  onClick={() => onEdit(activity)}
                  aria-label={t('common.edit')}
                  className="p-1 rounded text-muted hover:text-primary transition-colors"
                >
                  <Pencil size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(activity.id)}
                  aria-label={t('common.delete')}
                  className="p-1 rounded text-muted hover:text-danger transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {activity.category && (
            <Badge variant="default">{t(`activity.category.${activity.category}`)}</Badge>
          )}
          {activity.location_name && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {activity.location_name}
            </span>
          )}
          {activity.start_time && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {activity.start_time}
            </span>
          )}
          {activity.duration_minutes && (
            <span>{activity.duration_minutes} {t('activity.duration')}</span>
          )}
        </div>

        {activity.description && (
          <p className="text-xs text-muted mt-1.5 line-clamp-2">{sanitizeText(activity.description)}</p>
        )}
      </div>
    </div>
  )
}

ActivityCard.propTypes = {
  activity: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    order_index: PropTypes.number,
    category: PropTypes.string,
    location_name: PropTypes.string,
    start_time: PropTypes.string,
    duration_minutes: PropTypes.number,
    description: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  showControls: PropTypes.bool,
}

export default ActivityCard
