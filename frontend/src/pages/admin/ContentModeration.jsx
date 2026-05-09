import { useEffect, useState, useCallback } from 'react'
import { Trash2, Eye, ChevronLeft, ChevronRight, MapPin, Calendar } from 'lucide-react'
import { getItineraries, deleteItinerary } from '@/services/adminService'

function ContentModeration() {
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [deleting, setDeleting] = useState(null)
  const limit = 20

  useEffect(() => {
    document.title = 'Locavio — Content Moderation'
  }, [])

  const loadItineraries = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getItineraries(page * limit, limit)
      setItineraries(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load itineraries')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadItineraries()
  }, [loadItineraries])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this itinerary? This cannot be undone.')) return
    setDeleting(id)
    try {
      await deleteItinerary(id)
      setItineraries((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to delete itinerary')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
        <p className="text-gray-400 text-sm mt-1">Review and manage all generated itineraries</p>
      </div>

      {error && (
        <div className="text-red-400 text-sm p-4 rounded-lg" style={{ backgroundColor: '#1e293b' }}>
          {error}
        </div>
      )}

      {/* Itineraries grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : itineraries.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl"
          style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
        >
          <p className="text-gray-500">No itineraries found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itineraries.map((itin) => (
            <div
              key={itin.id}
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">
                    {itin.title || 'Untitled Trip'}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    User #{itin.user_id} · {itin.purpose}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0
                    ${itin.generated_by_ai
                      ? 'bg-purple-500/15 text-purple-400'
                      : 'bg-gray-500/15 text-gray-400'
                    }`}
                >
                  {itin.generated_by_ai ? 'AI' : 'Manual'}
                </span>
              </div>

              {itin.description && (
                <p className="text-gray-400 text-xs line-clamp-2">{itin.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                {itin.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {itin.location}
                  </span>
                )}
                {itin.date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {itin.date}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: '#334155' }}>
                <span className="text-xs text-gray-500">
                  {new Date(itin.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs px-2 py-1 rounded-full
                      ${itin.status === 'published'
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-gray-500/15 text-gray-400'
                      }`}
                  >
                    {itin.status}
                  </span>
                  <button
                    onClick={() => handleDelete(itin.id)}
                    disabled={deleting === itin.id}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                    title="Delete itinerary"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && itineraries.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-xs text-gray-500">Page {page + 1}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={itineraries.length < limit}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default ContentModeration
