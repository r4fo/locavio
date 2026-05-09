import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

function AdminRoute() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default AdminRoute