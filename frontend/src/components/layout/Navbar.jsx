import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Map, Users, Menu, ChevronDown, LogOut, User, Shield, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useLanguage } from '@/hooks/useLanguage'

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'ar', label: 'AR' },
  { code: 'tr', label: 'TR' },
]

function Navbar() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { toggleSidebar } = useUiStore()
  const { language, changeLanguage, t } = useLanguage()
  const navigate = useNavigate()

  const [langOpen, setLangOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const langRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initial = user?.name?.[0]?.toUpperCase() || '?'

  return (
    <header className="bg-card border-b border-accent/30 sticky top-0 z-30">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg text-muted hover:text-espresso transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-1.5 font-semibold text-primary text-lg">
            <span>🗺️</span>
            <span className="hidden sm:block">Locavio</span>
          </NavLink>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {[
            { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
            { to: '/itineraries', icon: Map, label: t('nav.itineraries') },
            { to: '/communities', icon: Users, label: t('nav.communities') },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-primary text-white' : 'text-espresso hover:bg-surface'}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-primary text-white' : 'text-primary hover:bg-surface border border-primary/30'}`
              }
            >
              <Shield size={16} />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-muted hover:text-espresso hover:bg-surface transition-colors"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              {language.toUpperCase()}
              <ChevronDown size={14} />
            </button>
            {langOpen && (
              <ul
                role="listbox"
                className="absolute right-0 top-full mt-1 bg-card border border-accent/30 rounded-xl shadow-md py-1 min-w-[80px] z-50"
              >
                {LANGUAGES.map(({ code, label }) => (
                  <li key={code}>
                    <button
                      role="option"
                      aria-selected={language === code}
                      onClick={() => { changeLanguage(code); setLangOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-surface transition-colors
                        ${language === code ? 'text-primary font-medium' : 'text-espresso'}`}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div ref={userRef} className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                {initial}
              </div>
            </button>
            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 bg-card border border-accent/30 rounded-xl shadow-md py-1 min-w-[160px] z-50"
              >
                <NavLink
                  to="/profile"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-espresso hover:bg-surface transition-colors"
                >
                  <User size={15} />
                  {t('nav.profile')}
                </NavLink>
                {user?.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-surface transition-colors"
                  >
                    <ShieldCheck size={15} />
                    Admin Dashboard
                  </NavLink>
                )}
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-surface transition-colors"
                >
                  <LogOut size={15} />
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
