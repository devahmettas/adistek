import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminRestaurantCard from '../components/admin/AdminRestaurantCard'
import { AdminEmptyState, AdminStatsGrid } from '../components/admin/AdminDashboardWidgets'
import Input from '../components/Input'
import LoadingState from '../components/LoadingState'
import PageHeader from '../components/PageHeader'
import useAdminRestaurants from '../hooks/useAdminRestaurants'
import { useAdminAuth } from '../store/AdminAuthStore'
import { computeAdminDashboardStats } from '../utils/adminDashboard'

export default function AdminRestaurantsPage() {
  const { admin } = useAdminAuth()
  const { restaurants, loading, error } = useAdminRestaurants()
  const [search, setSearch] = useState('')

  const stats = useMemo(() => computeAdminDashboardStats(restaurants), [restaurants])

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return restaurants
    }

    return restaurants.filter((restaurant) => {
      const haystack = [
        restaurant.name,
        restaurant.contact_person,
        restaurant.phone,
        restaurant.address,
        restaurant.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [restaurants, search])

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
              Platformdaki tüm restoranları buradan yönetin. Yeni işletme eklemek için sağ üstteki
              veya aşağıdaki butonu kullanın.
            </p>
          </div>

          <Link
            to="/admin/restaurants/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-brand-800 shadow-sm transition hover:bg-brand-50"
          >
            <span aria-hidden>＋</span>
            Restoran Ekle
          </Link>
        </div>
      </section>

      {!loading && !error && restaurants.length > 0 && <AdminStatsGrid stats={stats} />}

      <PageHeader
        title="Restoranlar"
        description={`${restaurants.length} kayıtlı işletme`}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <Input
          label="Restoran Ara"
          name="restaurantSearch"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Restoran adı, yetkili, telefon, adres veya e-posta"
        />
      </div>

      {loading && <LoadingState label="Restoranlar yükleniyor..." />}
      {error && <p className="alert-error">{error}</p>}

      {!loading && !error && filteredRestaurants.length === 0 && (
        <AdminEmptyState hasSearch={search.trim().length > 0} />
      )}

      {!loading && filteredRestaurants.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRestaurants.map((restaurant) => (
            <AdminRestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  )
}
