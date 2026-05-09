import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { MapPin, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { sanitizeText } from '@/utils/sanitize'

function CommunityCard({ community, onJoin, isMember = false }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div
      className="card hover:shadow-md transition-all duration-200 flex flex-col gap-3 cursor-pointer"
      onClick={() => navigate(`/communities/${community.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/communities/${community.id}`)}
    >
      <div
        className="rounded-lg h-28 flex items-end p-3"
        style={{
          background: community.cover_image
            ? `url(${community.cover_image}) center/cover`
            : 'linear-gradient(135deg, #A0522D 0%, #D4A373 100%)',
        }}
      >
        {community.category && (
          <Badge variant="default">{community.category}</Badge>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-espresso text-base line-clamp-1">{sanitizeText(community.name)}</h3>
        {community.description && (
          <p className="text-xs text-muted mt-0.5 line-clamp-2">{sanitizeText(community.description)}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-col gap-1 text-xs text-muted">
          {community.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {community.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={11} />
            {community.member_count ?? 0} {t('community.members')}
          </span>
        </div>

        {!isMember && onJoin && (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); onJoin(community.id) }}
          >
            {t('community.join')}
          </Button>
        )}
      </div>
    </div>
  )
}

CommunityCard.propTypes = {
  community: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    location: PropTypes.string,
    category: PropTypes.string,
    cover_image: PropTypes.string,
    member_count: PropTypes.number,
  }).isRequired,
  onJoin: PropTypes.func,
  isMember: PropTypes.bool,
}

export default CommunityCard
