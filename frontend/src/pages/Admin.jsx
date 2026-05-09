import { useEffect, useState, useCallback } from 'react'
import { Shield, Users, Map, Users2, TrendingUp, Trash2, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { useAdmin } from '@/hooks/useAdmin'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

const ROLE_COLORS = {
  guest: 'bg-muted/20 text-muted',
  user: 'bg-blue-100 text-blue-700',
  admin: 'bg-primary/10 text-primary font-semibold',
}

const PERMISSION_MATRIX = [
  { action: 'View public pages',      guest: true,  user: true,  admin: true },
  { action: 'Create itineraries',     guest: false, user: true,  admin: true },
  { action: 'Join communities',       guest: false, user: true,  admin: true },
  { action: 'Write reviews',          guest: false, user: true,  admin: true },
  { action: 'Access admin dashboard', guest: false, user: false, admin: true },
  { action: 'Change user roles',      guest: false, user: false, admin: true },
  { action: 'Delete any user',        guest: false, user: false, admin: true },
]

function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={22} className="text-primary" />
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-16 bg-accent/30 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-espresso">{value ?? '—'}</p>
        )}
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  )
}

function RoleBadge({ role, userId, onChangeRole }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`px-2.5 py-1 rounded-full text-xs cursor-pointer ${ROLE_COLORS[role] || ROLE_COLORS.user}`}
      >
        {role}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-card border border-accent/30 rounded-xl shadow-md py-1 z-20 min-w-[100px]">
          {['guest', 'user', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => { onChangeRole(userId, r); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface transition-colors
                ${r === role ? 'text-primary font-medium' : 'text-espresso'}`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-accent/20 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

function PermissionMatrix() {
  return (
    <div className="card overflow-x-auto mt-8">
      <h2 className="text-lg font-semibold text-espresso mb-4">Permission Matrix</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary text-white">
            <th className="text-left px-4 py-2 rounded-tl-lg">Action</th>
            <th className="text-center px-4 py-2">Guest</th>
            <th className="text-center px-4 py-2">User</th>
            <th className="text-center px-4 py-2 rounded-tr-lg">Admin</th>
          </tr>
        </thead>
        <tbody>
          {PERMISSION_MATRIX.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-surface' : 'bg-card'}>
              <td className="px-4 py-2 text-espresso">{row.action}</td>
              {['guest', 'user', 'admin'].map((role) => (
                <td key={role} className="text-center px-4 py-2">
                  {row[role]
                    ? <Check size={16} className="text-success mx-auto" />
                    : <X size={16} className="text-danger mx-auto" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Admin() {
  const { users, stats, loading, error, fetchUsers, fetchStats, changeRole, removeUser } = useAdmin()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [searchTimer, setSearchTimer] = useState(null)

  const load = useCallback((overrides = {}) => {
    fetchUsers({ page, search, role: roleFilter, ...overrides })
  }, [fetchUsers, page, search, roleFilter])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    load()
  }, [page, roleFilter])

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearch(val)
    clearTimeout(searchTimer)
    const timer = setTimeout(() => {
      setPage(1)
      fetchUsers({ page: 1, search: val, role: roleFilter })
    }, 300)
    setSearchTimer(timer)
  }

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value)
    setPage(1)
  }

  const handleChangeRole = async (userId, role) => {
    try {
      await changeRole(userId, role)
    } catch {
      // error shown via state
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await removeUser(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // error shown via state
    } finally {
      setDeleting(false)
    }
  }

  const userList = Array.isArray(users) ? users : (users?.users ?? [])
  const totalPages = users?.pages ?? 1
  const total = users?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={28} className="text-primary" />
        <h1 className="text-2xl font-bold text-espresso">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.total_users} loading={loading && !stats} />
        <StatCard icon={Map} label="Total Itineraries" value={stats?.total_itineraries} loading={loading && !stats} />
        <StatCard icon={Users2} label="Total Communities" value={stats?.total_communities} loading={loading && !stats} />
        <StatCard icon={TrendingUp} label="New This Week" value={stats?.new_users_this_week} loading={loading && !stats} />
      </div>

      {/* Users table */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={handleSearchChange}
            className="flex-1 border border-accent/40 rounded-lg px-3 py-2 text-sm text-espresso bg-surface focus:outline-none focus:border-primary"
          />
          <select
            value={roleFilter}
            onChange={handleRoleFilter}
            className="border border-accent/40 rounded-lg px-3 py-2 text-sm text-espresso bg-surface focus:outline-none focus:border-primary"
          >
            <option value="">All Roles</option>
            <option value="guest">Guest</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {error && (
          <p className="text-danger text-sm mb-3">{error}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-accent/30 text-muted text-left">
                <th className="pb-2 px-2">Avatar</th>
                <th className="pb-2 px-2">Name</th>
                <th className="pb-2 px-2">Email</th>
                <th className="pb-2 px-2">Role</th>
                <th className="pb-2 px-2">Auth</th>
                <th className="pb-2 px-2">Joined</th>
                <th className="pb-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : userList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    No users found
                  </td>
                </tr>
              ) : (
                userList.map((u) => (
                  <tr key={u.id} className="border-b border-accent/10 hover:bg-surface transition-colors">
                    <td className="py-3 px-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                        {u.name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium text-espresso">{u.name || '—'}</td>
                    <td className="py-3 px-2 text-muted">{u.email}</td>
                    <td className="py-3 px-2">
                      <RoleBadge role={u.role} userId={u.id} onChangeRole={handleChangeRole} />
                    </td>
                    <td className="py-3 px-2 text-muted capitalize">{u.auth_provider}</td>
                    <td className="py-3 px-2 text-muted">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                        aria-label="Delete user"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-accent/20">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-espresso hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-sm text-muted">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-espresso hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Permission Matrix */}
      <PermissionMatrix />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete User"
        >
          <p className="text-espresso mb-6">
            Are you sure you want to delete <strong>{deleteTarget.name || deleteTarget.email}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteTarget(null)}
              className="btn-secondary"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-danger text-white rounded-lg px-4 py-2 hover:bg-danger/80 transition-colors font-medium disabled:opacity-50"
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Admin