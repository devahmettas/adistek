import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import JewelrySaleCartButton from '../components/jeweler/JewelrySaleCartButton'
import JewelrySaleCartCheckoutModal from '../components/jeweler/JewelrySaleCartCheckoutModal'
import JewelrySaleToastListener from '../components/jeweler/JewelrySaleToastListener'
import RestaurantSidebar from '../components/RestaurantSidebar'
import { JewelrySaleCartProvider } from '../context/JewelrySaleCartContext'

function MainLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleToggleMenu = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setSidebarOpen((value) => !value)
    } else {
      setMobileMenuOpen((value) => !value)
    }
  }

  return (
    <div className="app-canvas min-h-dvh overflow-x-clip">
      <RestaurantSidebar
        open={sidebarOpen}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div
        className={`flex min-h-dvh min-w-0 flex-col transition-[margin] duration-200 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <AppHeader
          label="Kuyumcu Paneli"
          onToggleMenu={handleToggleMenu}
          trailing={<JewelrySaleCartButton />}
        />

        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <div className="mx-auto w-full min-w-0 max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <JewelrySaleCartCheckoutModal />
      <JewelrySaleToastListener />
    </div>
  )
}

export default function MainLayout() {
  return (
    <JewelrySaleCartProvider>
      <MainLayoutContent />
    </JewelrySaleCartProvider>
  )
}
