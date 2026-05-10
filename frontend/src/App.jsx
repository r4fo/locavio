import { Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'

import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AdminRoute from '@/components/layout/AdminRoute'
import AdminProtectedRoute from '@/components/layout/AdminProtectedRoute'
import AdminLayout from '@/components/layout/AdminLayout'
import Spinner from '@/components/ui/Spinner'

import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import ItineraryList from '@/pages/ItineraryList'
import ItineraryNew from '@/pages/ItineraryNew'
import ItineraryDetail from '@/pages/ItineraryDetail'
import CommunityList from '@/pages/CommunityList'
import CommunityNew from '@/pages/CommunityNew'
import CommunityDetail from '@/pages/CommunityDetail'
import Profile from '@/pages/Profile'
import LinkedInCallback from '@/pages/LinkedInCallback'
import Admin from '@/pages/Admin'
import Unauthorized from '@/pages/Unauthorized'
import Permissions from '@/pages/Permissions'
import GitHubCallback from '@/pages/GitHubCallback'
import TwoFactorSettings from '@/pages/TwoFactorSettings'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import UserManagement from '@/pages/admin/UserManagement'
import ContentModeration from '@/pages/admin/ContentModeration'

function AppLayout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col overflow-x-hidden">
      <Navbar />
      <Sidebar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage)
  const language = useUiStore((state) => state.language)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    document.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-surface">
            <Spinner size="lg" />
          </div>
        }
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/admin/permissions" element={<Permissions />} />
            <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
            <Route path="/auth/github/callback" element={<GitHubCallback />} />

            {/* Regular authenticated user routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/itineraries" element={<ItineraryList />} />
                <Route path="/itineraries/new" element={<ItineraryNew />} />
                <Route path="/itineraries/:id" element={<ItineraryDetail />} />
                <Route path="/communities" element={<CommunityList />} />
                <Route path="/communities/new" element={<CommunityNew />} />
                <Route path="/communities/:id" element={<CommunityDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings/2fa" element={<TwoFactorSettings />} />
              </Route>
            </Route>

            {/* Admin-only routes with distinct layout */}
            <Route element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/moderation" element={<ContentModeration />} />
              </Route>
            </Route>

            <Route element={<AdminRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </GoogleOAuthProvider>
  )
}

export default App
