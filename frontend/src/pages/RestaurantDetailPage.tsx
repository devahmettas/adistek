import { FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import Textarea from '../components/Textarea'
import useRestaurantDetail from '../hooks/useRestaurantDetail'

export default function RestaurantDetailPage() {
  const { id } = useParams()
  const restaurantId = Number(id)
  const { categories, products, loading, error, addCategory, addProduct } =
    useRestaurantDetail(restaurantId)

  const [categoryName, setCategoryName] = useState('')
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)
  const [submittingCategory, setSubmittingCategory] = useState(false)
  const [submittingProduct, setSubmittingProduct] = useState(false)

  if (!restaurantId) {
    return <p className="text-sm text-red-600">Geçersiz restoran.</p>
  }

  const handleCategorySubmit = async (event: FormEvent) => {
    event.preventDefault()
    setCategoryError(null)

    if (!categoryName.trim()) {
      setCategoryError('Kategori adı zorunludur.')
      return
    }

    setSubmittingCategory(true)

    try {
      await addCategory(categoryName.trim())
      setCategoryName('')
    } catch {
      setCategoryError('Kategori eklenemedi.')
    } finally {
      setSubmittingCategory(false)
    }
  }

  const handleProductSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setProductError(null)

    if (!categoryId) {
      setProductError('Kategori seçimi zorunludur.')
      return
    }

    if (!productName.trim()) {
      setProductError('Ürün adı zorunludur.')
      return
    }

    const price = Number(productPrice)
    if (Number.isNaN(price) || price < 0) {
      setProductError('Geçerli bir fiyat girin.')
      return
    }

    setSubmittingProduct(true)

    try {
      await addProduct({
        category_id: Number(categoryId),
        name: productName.trim(),
        price,
        description: productDescription.trim() || undefined,
      })
      setProductName('')
      setProductPrice('')
      setProductDescription('')
    } catch {
      setProductError('Ürün eklenemedi.')
    } finally {
      setSubmittingProduct(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-blue-600 hover:text-blue-700">
          ← Restoranlara dön
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Restoran Detayı</h1>
        <p className="mt-1 text-sm text-gray-600">Kategori ve ürün yönetimi</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && (
        <>
          <Card title="Kategori Ekle">
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <Input
                label="Kategori Adı"
                name="categoryName"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Örn: İçecekler"
              />
              {categoryError && <p className="text-sm text-red-600">{categoryError}</p>}
              <Button type="submit" disabled={submittingCategory}>
                {submittingCategory ? 'Kaydediliyor...' : 'Kategori Ekle'}
              </Button>
            </form>
          </Card>

          <Card title="Ürün Ekle">
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <Select
                label="Kategori"
                name="categoryId"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                options={[
                  { value: '', label: 'Kategori seçin' },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]}
              />
              <Input
                label="Ürün Adı"
                name="productName"
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                placeholder="Örn: Latte"
              />
              <Input
                label="Fiyat"
                name="productPrice"
                type="number"
                min="0"
                step="0.01"
                value={productPrice}
                onChange={(event) => setProductPrice(event.target.value)}
                placeholder="0.00"
              />
              <Textarea
                label="Açıklama"
                name="productDescription"
                rows={3}
                value={productDescription}
                onChange={(event) => setProductDescription(event.target.value)}
                placeholder="Opsiyonel açıklama"
              />
              {productError && <p className="text-sm text-red-600">{productError}</p>}
              <Button type="submit" disabled={submittingProduct || categories.length === 0}>
                {submittingProduct ? 'Kaydediliyor...' : 'Ürün Ekle'}
              </Button>
            </form>
          </Card>

          <Card title="Ürünler">
            {products.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz ürün eklenmemiş.</p>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">
                          {product.category?.name || 'Kategori yok'}
                        </p>
                      </div>
                      <p className="font-semibold text-blue-700">
                        {Number(product.price).toFixed(2)} ₺
                      </p>
                    </div>
                    {product.description && (
                      <p className="mt-2 text-sm text-gray-600">{product.description}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
