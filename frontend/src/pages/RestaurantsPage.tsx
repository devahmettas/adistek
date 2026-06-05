import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import useRestaurants from '../hooks/useRestaurants'

export default function RestaurantsPage() {
  const { restaurants, loading, error, addRestaurant } = useRestaurants()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('Restoran adı zorunludur.')
      return
    }

    setSubmitting(true)

    try {
      await addRestaurant(name.trim())
      setName('')
    } catch {
      setFormError('Restoran eklenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restoranlar</h1>
        <p className="mt-1 text-sm text-gray-600">
          Restoran ekleyin ve menü yönetimine geçin.
        </p>
      </div>

      <Card title="Yeni Restoran Ekle">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Restoran Adı"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Örn: Adistek Cafe"
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kaydediliyor...' : 'Ekle'}
          </Button>
        </form>
      </Card>

      <Card title="Restoran Listesi">
        {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && restaurants.length === 0 && (
          <p className="text-sm text-gray-500">Henüz restoran eklenmemiş.</p>
        )}

        {!loading && restaurants.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {restaurants.map((restaurant) => (
              <li
                key={restaurant.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{restaurant.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(restaurant.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <Link
                  to={`/restaurants/${restaurant.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Detay
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
