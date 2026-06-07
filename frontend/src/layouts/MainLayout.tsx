import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import RestaurantSidebar from '../components/RestaurantSidebar'
import { DashboardProvider } from '../context/DashboardContext'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-gray-50">
        <RestaurantSidebar
          open={sidebarOpen}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div
          className={`flex min-h-screen min-w-0 flex-col transition-[margin] duration-200 ${
            sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
          }`}
        >
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => {
                if (window.matchMedia('(min-width: 1024px)').matches) {
                  setSidebarOpen((value) => !value)
                } else {
                  setMobileMenuOpen((value) => !value)
                }
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              aria-label="Menüyü aç/kapat"
            >
              ☰ Menü
            </button>
          </header>

          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </DashboardProvider>
  )
}
