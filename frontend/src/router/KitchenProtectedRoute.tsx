import { Navigate, Outlet } from 'react-router-dom'
import { useKitchenAuth } from '../store/KitchenAuthStore'

export default function KitchenProtectedRoute() {
  const { isAuthenticated, loading } = useKitchenAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500">Yükleniyor...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/kitchen/login" replace />
  }

  return <Outlet />
}
