import { useEffect, useState, useCallback } from 'react'
import { Search, Shield, ShieldOff, Ban, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { getUsers, updateUser } from '@/services/adminService'

const ROLE_BADGE_STYLES = {
  admin: 'bg-amber-500/15 text-amber-400',
  user: 'bg-blue-500/15 text-blue-400',
}

const PROVIDER_BADGE_STYLES = {
  google: 'bg-red-500/15 text-red-400',
  linkedin: 'bg-blue-600/15 text-blue-300',
  email: 'bg-gray-500/15 text-gray-400',
}

function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [actionLoading, setActionLoading] = useState(null) // user id being acted on
  const limit = 20

  useEffect(() => {
    document.title = 'Locavio — User Management'
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsers(search, page * limit, limit)
      setUsers(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    loadUsers()
  }

  const handleUpdateUser = async (userId, data) => {
    setActionLoading(userId)
    try {
      const updated = await updateUser(userId, data)
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to update user')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-400 text-sm mt-1">View, search, and manage all users</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="text-red-400 text-sm p-4 rounded-lg" style={{ backgroundColor: '#1e293b' }}>
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Provider</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Joined</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t" style={{ borderColor: '#334155' }}>
                    {/* User info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name || 'No name'}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Auth provider */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${PROVIDER_BADGE_STYLES[user.auth_provider] || 'bg-gray-500/15 text-gray-400'}`}>
                        {user.auth_provider}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_BADGE_STYLES[user.role] || 'bg-gray-500/15 text-gray-400'}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <Ban size={14} /> Banned
                        </span>
                      )}
                    </td>

                    {/* Joined date */}
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Toggle role */}
                        <button
                          onClick={() => handleUpdateUser(user.id, {
                            role: user.role === 'admin' ? 'user' : 'admin'
                          })}
                          disabled={actionLoading === user.id}
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30"
                          title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                        >
                          {user.role === 'admin' ? (
                            <ShieldOff size={16} className="text-amber-400" />
                          ) : (
                            <Shield size={16} className="text-blue-400" />
                          )}
                        </button>

                        {/* Toggle active status */}
                        <button
                          onClick={() => handleUpdateUser(user.id, {
                            is_active: !user.is_active
                          })}
                          disabled={actionLoading === user.id}
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30"
                          title={user.is_active ? 'Ban user' : 'Unban user'}
                        >
                          {user.is_active ? (
                            <Ban size={16} className="text-red-400" />
                          ) : (
                            <CheckCircle size={16} className="text-green-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: '#334155' }}>
          <p className="text-xs text-gray-500">
            Showing {users.length} users {search && `matching "${search}"`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-400">Page {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length < limit}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement
