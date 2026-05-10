import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Map, Users, User, X } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/itineraries', icon: Map, labelKey: 'nav.itineraries' },
  { to: '/communities', icon: Users, labelKey: 'nav.communities' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
]

function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const logout = useAuthStore((state) => state.logout)
  const { t } = useTranslation()
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [sidebarOpen])

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-espresso/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card shadow-md z-50 transform transition-transform duration-300 lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Sidebar navigation"
      >
        <div className="flex items-center justify-between p-4 border-b border-accent/30">
          <span className="text-primary font-semibold text-lg">🗺️ Locavio</span>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="p-1 rounded-lg text-muted hover:text-espresso transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 flex flex-col gap-1">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-primary text-white' : 'text-espresso hover:bg-surface'}`
              }
            >
              <Icon size={18} />
              {t(labelKey)}
            </NavLink>
          ))}

          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-espresso hover:bg-surface transition-colors mt-4"
          >
            {t('nav.logout')}
          </button>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
