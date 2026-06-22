import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminRestaurantCard from '../components/admin/AdminRestaurantCard'
import { AdminEmptyState } from '../components/admin/AdminDashboardWidgets'
import Input from '../components/Input'
import LoadingState from '../components/LoadingState'
import PageHeader from '../components/PageHeader'
import useAdminRestaurants from '../hooks/useAdminRestaurants'

export default function AdminBusinessListPage() {
  const { restaurants, loading, error } = useAdminRestaurants()
  const [search, setSearch] = useState('')

  const expiredCount = useMemo(
    () => restaurants.filter((restaurant) => restaurant.membership_expired).length,
    [restaurants],
  )

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
      <PageHeader
        title="İşletme Listesi"
        description={`${restaurants.length} kayıtlı işletme${expiredCount > 0 ? ` · ${expiredCount} süresi dolmuş` : ''}`}
        actions={
          <Link
            to="/admin/restaurants/new"
            className="inline-flex items-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
          >
            ＋ İşletme Ekle
          </Link>
        }
      />

      {expiredCount > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 shadow-card">
          <p className="font-bold">{expiredCount} işletmenin üyelik süresi dolmuş</p>
          <p className="mt-1 text-red-700">
            İşletmeye tıklayarak üyelik yönetimi bölümünden gün ekleyebilirsiniz.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <Input
          label="İşletme Ara"
          name="restaurantSearch"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="İşletme adı, yetkili, telefon, adres veya e-posta"
        />
      </div>

      {loading && <LoadingState label="İşletmeler yükleniyor..." />}
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
