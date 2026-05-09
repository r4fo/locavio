import { Shield, Check, X } from 'lucide-react'

const PERMISSION_MATRIX = [
  { action: 'View public pages',      guest: true,  user: true,  admin: true },
  { action: 'Create itineraries',     guest: false, user: true,  admin: true },
  { action: 'Join communities',       guest: false, user: true,  admin: true },
  { action: 'Write reviews',          guest: false, user: true,  admin: true },
  { action: 'Access admin dashboard', guest: false, user: false, admin: true },
  { action: 'Change user roles',      guest: false, user: false, admin: true },
  { action: 'Delete any user',        guest: false, user: false, admin: true },
]

function Permissions() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="card max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={28} className="text-primary" />
          <h1 className="text-2xl font-bold text-espresso">Role Permission Matrix</h1>
        </div>
        <p className="text-muted text-sm mb-6">
          Overview of what each role can do in Locavio.
        </p>
        <div className="overflow-x-auto">
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
      </div>
    </div>
  )
}

export default Permissions