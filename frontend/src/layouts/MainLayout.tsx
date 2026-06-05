import { ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'

interface MainLayoutProps {
  children?: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Menu Yönetimi
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children ?? <Outlet />}</main>
    </div>
  )
}
