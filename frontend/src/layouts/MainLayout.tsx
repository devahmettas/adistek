import { Link, Outlet } from 'react-router-dom'
import Button from '../components/Button'
import { useAuth } from '../store/AuthStore'

export default function MainLayout() {
  const { restaurant, isAuthenticated, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="text-xl font-bold text-gray-900">
            Menu Yönetimi
          </Link>
          {isAuthenticated && restaurant && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-gray-600 sm:inline">{restaurant.name}</span>
              <Button variant="secondary" onClick={handleLogout}>
                Çıkış
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
