import { ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'

interface AdminLayoutProps {
  children?: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/admin/restaurants" className="text-xl font-bold text-gray-900">
            Adistek Admin
          </Link>
          <span className="text-sm text-gray-500">Süper Admin Paneli</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children ?? <Outlet />}</main>
    </div>
  )
}
