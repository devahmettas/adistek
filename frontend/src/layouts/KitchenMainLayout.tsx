import { Link, Outlet } from 'react-router-dom'
import Button from '../components/Button'
import { useKitchenAuth } from '../store/KitchenAuthStore'

export default function KitchenMainLayout() {
  const { kitchenStaff, logout } = useKitchenAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/kitchen/dashboard" className="text-xl font-bold text-white">
            Mutfak Paneli
          </Link>
          {kitchenStaff && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-gray-300 sm:inline">{kitchenStaff.name}</span>
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
