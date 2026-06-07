import { FormEvent, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import ProductList from '../../components/ProductList'
import Select from '../../components/Select'
import Textarea from '../../components/Textarea'
import { useDashboardData } from '../../context/DashboardContext'

export default function ProductsPage() {
  const {
    categories,
    products,
    loading,
    error,
    addProduct,
    editProduct,
    removeProduct,
    toggleProductStatus,
  } = useDashboardData()

  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [productError, setProductError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
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

    setSubmitting(true)

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
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
        <p className="mt-1 text-sm text-gray-600">Menü ürünlerini ekleyin ve yönetin.</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && (
        <>
          <Card title="Ürün Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" disabled={submitting || categories.length === 0}>
                {submitting ? 'Kaydediliyor...' : 'Ürün Ekle'}
              </Button>
            </form>
          </Card>

          <Card title="Ürün Listesi">
            <ProductList
              products={products}
              categories={categories}
              onUpdate={editProduct}
              onDelete={removeProduct}
              onToggleStatus={toggleProductStatus}
              showCategoryFilter
            />
          </Card>
        </>
      )}
    </div>
  )
}
