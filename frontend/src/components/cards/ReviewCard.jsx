import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import StarRating from '@/components/ui/StarRating'
import { sanitizeText } from '@/utils/sanitize'

function ReviewCard({ review }) {
  const { t } = useTranslation()
  const initial = review.user?.name?.[0]?.toUpperCase() || '?'

  const formattedDate = review.created_at
    ? new Date(review.created_at).toLocaleDateString()
    : ''

  return (
    <div className="card flex gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-espresso">
            {review.user?.name || 'Anonymous'}
          </span>
          <span className="text-xs text-muted shrink-0">{formattedDate}</span>
        </div>

        <StarRating rating={review.rating} />

        {review.comment && (
          <p className="text-sm text-muted mt-1.5 leading-relaxed">{sanitizeText(review.comment)}</p>
        )}
      </div>
    </div>
  )
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.number,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string,
    created_at: PropTypes.string,
    user: PropTypes.shape({
      name: PropTypes.string,
    }),
  }).isRequired,
}

export default ReviewCard
