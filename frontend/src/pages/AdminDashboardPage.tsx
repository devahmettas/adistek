import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AdminStatsGrid } from '../components/admin/AdminDashboardWidgets'
import LoadingState from '../components/LoadingState'
import useAdminRestaurants from '../hooks/useAdminRestaurants'
import { useAdminAuth } from '../store/AdminAuthStore'
import { computeAdminDashboardStats } from '../utils/adminDashboard'

export default function AdminDashboardPage() {
  const { admin } = useAdminAuth()
  const { restaurants, loading, error } = useAdminRestaurants()

  const stats = useMemo(() => computeAdminDashboardStats(restaurants), [restaurants])

  const expiredCount = useMemo(
    () => restaurants.filter((restaurant) => restaurant.membership_expired).length,
    [restaurants],
  )

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 px-6 py-8 text-white shadow-panel lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
              Süper Admin Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              Hoş geldiniz, {admin?.name ?? 'Admin'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-100">
              Platform özeti ve işletme istatistikleri. İşletmeleri listelemek veya üyelik yönetmek
              için işletme listesine gidin.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/restaurants/list"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              İşletme Listesi
            </Link>
            <Link
              to="/admin/restaurants/new"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-brand-800 shadow-sm transition hover:bg-brand-50"
            >
              <span aria-hidden>＋</span>
              İşletme Ekle
            </Link>
          </div>
        </div>
      </section>

      {expiredCount > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 shadow-card">
          <p className="font-bold">{expiredCount} işletmenin üyelik süresi dolmuş</p>
          <p className="mt-1 text-red-700">
            <Link to="/admin/restaurants/list" className="font-semibold underline">
              İşletme listesinden
            </Link>{' '}
            ilgili işletmeye tıklayarak üyelik süresini uzatabilirsiniz.
          </p>
        </div>
      )}

      {loading && <LoadingState label="Özet yükleniyor..." />}
      {error && <p className="alert-error">{error}</p>}

      {!loading && !error && restaurants.length > 0 && <AdminStatsGrid stats={stats} />}
    </div>
  )
}
