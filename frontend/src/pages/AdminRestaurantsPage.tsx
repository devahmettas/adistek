import Button from '../components/Button'
import Card from '../components/Card'
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restoranlar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Sistemi kullanan tüm restoranlar — {admin?.name}
          </p>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Çıkış
        </Button>
      </div>

      <Card title="Restoran Listesi">
        {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && restaurants.length === 0 && (
          <p className="text-sm text-gray-500">Henüz kayıtlı restoran yok.</p>
        )}

        {!loading && restaurants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="px-3 py-2 font-medium">Restoran</th>
                  <th className="px-3 py-2 font-medium">E-posta</th>
                  <th className="px-3 py-2 font-medium">Kategori</th>
                  <th className="px-3 py-2 font-medium">Ürün</th>
                  <th className="px-3 py-2 font-medium">Masa</th>
                  <th className="px-3 py-2 font-medium">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-3 font-medium text-gray-900">{restaurant.name}</td>
                    <td className="px-3 py-3 text-gray-600">{restaurant.email}</td>
                    <td className="px-3 py-3 text-gray-600">{restaurant.categories_count}</td>
                    <td className="px-3 py-3 text-gray-600">{restaurant.products_count}</td>
                    <td className="px-3 py-3 text-gray-600">{restaurant.tables_count}</td>
                    <td className="px-3 py-3 text-gray-600">
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
