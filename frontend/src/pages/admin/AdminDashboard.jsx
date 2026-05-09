import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Users, Map, UserPlus, ShieldCheck, TrendingUp } from 'lucide-react'
import { getStats } from '@/services/adminService'

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444']

function StatCard({ icon: Icon, label, value, color = '#f59e0b' }) {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Locavio — Admin Dashboard'
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getStats()
      setStats(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={loadStats} className="text-amber-400 hover:underline">Retry</button>
      </div>
    )
  }

  // Prepare chart data
  const providerData = stats?.auth_providers
    ? Object.entries(stats.auth_providers).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: count,
      }))
    : []

  const destinationData = stats?.top_destinations || []

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor your platform at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.total_users || 0} color="#3b82f6" />
        <StatCard icon={UserPlus} label="New This Week" value={stats?.new_users_this_week || 0} color="#10b981" />
        <StatCard icon={Map} label="Total Itineraries" value={stats?.total_itineraries || 0} color="#f59e0b" />
        <StatCard icon={ShieldCheck} label="Admins" value={stats?.total_admins || 0} color="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auth Provider Breakdown */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={18} className="text-amber-400" />
            Users by Auth Provider
          </h2>
          {providerData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={providerData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  strokeWidth={0}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {providerData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                />
                <Legend
                  wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          )}
        </div>

        {/* Top Destinations */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-400" />
            Top Destinations
          </h2>
          {destinationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={destinationData} layout="vertical">
                <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="destination"
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No destinations yet</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
          >
            Manage Users
          </button>
          <button
            onClick={() => navigate('/admin/moderation')}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
          >
            Review Itineraries
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
