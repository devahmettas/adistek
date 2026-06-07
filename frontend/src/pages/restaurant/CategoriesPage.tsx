import { FormEvent, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import CategoryList from '../../components/CategoryList'
import Input from '../../components/Input'
import { useDashboardData } from '../../context/DashboardContext'

export default function CategoriesPage() {
  const { categories, products, loading, error, addCategory, editCategory, removeCategory } =
    useDashboardData()
  const [categoryName, setCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setCategoryError(null)

    if (!categoryName.trim()) {
      setCategoryError('Kategori adı zorunludur.')
      return
    }

    setSubmitting(true)

    try {
      await addCategory(categoryName.trim())
      setCategoryName('')
    } catch {
      setCategoryError('Kategori eklenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
        <p className="mt-1 text-sm text-gray-600">Menü kategorilerini ekleyin, düzenleyin veya silin.</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && (
        <>
          <Card title="Kategori Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Kategori Adı"
                name="categoryName"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Örn: İçecekler"
              />
              {categoryError && <p className="text-sm text-red-600">{categoryError}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : 'Kategori Ekle'}
              </Button>
            </form>
          </Card>

          <Card title="Mevcut Kategoriler">
            <CategoryList
              categories={categories}
              products={products}
              onUpdate={editCategory}
              onDelete={removeCategory}
            />
          </Card>
        </>
      )}
    </div>
  )
}
