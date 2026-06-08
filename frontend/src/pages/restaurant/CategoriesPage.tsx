import { FormEvent, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import CategoryList from '../../components/CategoryList'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
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
      <PageHeader
        title="Kategoriler"
        description="Menü kategorilerini ekleyin, düzenleyin veya silin."
      />

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {!loading && (
        <>
          <Card title="Kategori Ekle" description="Yeni menü kategorisi oluşturun.">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Kategori Adı"
                name="categoryName"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Örn: İçecekler"
              />
              {categoryError && <p className="alert-error">{categoryError}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : 'Kategori Ekle'}
              </Button>
            </form>
          </Card>

          <Card title="Kategori Listesi">
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
