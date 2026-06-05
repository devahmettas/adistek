import { Navigate, Outlet } from 'react-router-dom'
import { useWaiterAuth } from '../store/WaiterAuthStore'

export default function WaiterProtectedRoute() {
  const { isAuthenticated, loading } = useWaiterAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500">Yükleniyor...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/waiter/login" replace />
  }

  return <Outlet />
}
