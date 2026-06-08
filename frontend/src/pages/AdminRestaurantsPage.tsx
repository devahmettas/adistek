import Button from '../components/Button'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import PageHeader from '../components/PageHeader'
import useAdminRestaurants from '../hooks/useAdminRestaurants'
import { useAdminAuth } from '../store/AdminAuthStore'

export default function AdminRestaurantsPage() {
  const { admin, logout } = useAdminAuth()
  const { restaurants, loading, error } = useAdminRestaurants()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restoranlar"
        description={`Sistemi kullanan tüm işletmeler — ${admin?.name ?? 'Admin'}`}
        actions={
          <Button variant="secondary" onClick={handleLogout}>
            Çıkış
          </Button>
        }
      />

      <Card title="Restoran Listesi">
        {loading && <LoadingState />}
        {error && <p className="alert-error">{error}</p>}

        {!loading && !error && restaurants.length === 0 && (
          <p className="text-sm text-slate-500">Henüz kayıtlı restoran yok.</p>
        )}

        {!loading && restaurants.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Restoran</th>
                  <th className="px-4 py-3 font-semibold">E-posta</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Ürün</th>
                  <th className="px-4 py-3 font-semibold">Masa</th>
                  <th className="px-4 py-3 font-semibold">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{restaurant.name}</td>
                    <td className="px-4 py-3 text-slate-600">{restaurant.email}</td>
                    <td className="px-4 py-3 text-slate-600">{restaurant.categories_count}</td>
                    <td className="px-4 py-3 text-slate-600">{restaurant.products_count}</td>
                    <td className="px-4 py-3 text-slate-600">{restaurant.tables_count}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(restaurant.created_at).toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
