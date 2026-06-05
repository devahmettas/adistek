import { FormEvent, useState } from 'react'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import Textarea from '../components/Textarea'
import useDashboard from '../hooks/useDashboard'
import { useAuth } from '../store/AuthStore'

export default function DashboardPage() {
  const { restaurant } = useAuth()
  const { categories, products, tables, loading, error, addCategory, addProduct, addTable, assignProductToTable } =
    useDashboard()

  const [categoryName, setCategoryName] = useState('')
  const [tableName, setTableName] = useState('')
  const [tableProductTableId, setTableProductTableId] = useState('')
  const [tableProductId, setTableProductId] = useState('')
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [tableError, setTableError] = useState<string | null>(null)
  const [tableProductError, setTableProductError] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)
  const [submittingCategory, setSubmittingCategory] = useState(false)
  const [submittingTable, setSubmittingTable] = useState(false)
  const [submittingTableProduct, setSubmittingTableProduct] = useState(false)
  const [submittingProduct, setSubmittingProduct] = useState(false)

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

  const handleTableSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTableError(null)

    if (!tableName.trim()) {
      setTableError('Masa adı zorunludur.')
      return
    }

    setSubmittingTable(true)

    try {
      await addTable(tableName.trim())
      setTableName('')
    } catch {
      setTableError('Masa eklenemedi.')
    } finally {
      setSubmittingTable(false)
    }
  }

  const handleTableProductSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTableProductError(null)

    if (!tableProductTableId) {
      setTableProductError('Masa seçimi zorunludur.')
      return
    }

    if (!tableProductId) {
      setTableProductError('Ürün seçimi zorunludur.')
      return
    }

    setSubmittingTableProduct(true)

    try {
      await assignProductToTable(Number(tableProductTableId), Number(tableProductId))
      setTableProductId('')
    } catch {
      setTableProductError('Ürün masaya eklenemedi.')
    } finally {
      setSubmittingTableProduct(false)
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
        <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name}</h1>
        <p className="mt-1 text-sm text-gray-600">Menü ve masa yönetimi</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
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

            <Card title="Masa Ekle">
              <form onSubmit={handleTableSubmit} className="space-y-4">
                <Input
                  label="Masa Adı"
                  name="tableName"
                  value={tableName}
                  onChange={(event) => setTableName(event.target.value)}
                  placeholder="Örn: Masa 1"
                />
                {tableError && <p className="text-sm text-red-600">{tableError}</p>}
                <Button type="submit" disabled={submittingTable}>
                  {submittingTable ? 'Kaydediliyor...' : 'Masa Ekle'}
                </Button>
              </form>
            </Card>
          </div>

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

          <Card title="Masaya Ürün Ekle">
            <form onSubmit={handleTableProductSubmit} className="space-y-4">
              <Select
                label="Masa"
                name="tableProductTableId"
                value={tableProductTableId}
                onChange={(event) => setTableProductTableId(event.target.value)}
                options={[
                  { value: '', label: 'Masa seçin' },
                  ...tables.map((table) => ({
                    value: table.id,
                    label: table.name,
                  })),
                ]}
              />
              <Select
                label="Ürün"
                name="tableProductId"
                value={tableProductId}
                onChange={(event) => setTableProductId(event.target.value)}
                options={[
                  { value: '', label: 'Ürün seçin' },
                  ...products.map((product) => ({
                    value: product.id,
                    label: `${product.name} (${Number(product.price).toFixed(2)} ₺)`,
                  })),
                ]}
              />
              {tableProductError && <p className="text-sm text-red-600">{tableProductError}</p>}
              <Button
                type="submit"
                disabled={submittingTableProduct || tables.length === 0 || products.length === 0}
              >
                {submittingTableProduct ? 'Ekleniyor...' : 'Masaya Ekle'}
              </Button>
            </form>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Masalar">
              {tables.length === 0 ? (
                <p className="text-sm text-gray-500">Henüz masa eklenmemiş.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {tables.map((table) => (
                    <li key={table.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-medium text-gray-900">{table.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(table.created_at).toLocaleString('tr-TR')}
                      </p>
                      {table.products && table.products.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {table.products.map((product) => (
                            <li
                              key={product.id}
                              className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1 text-sm"
                            >
                              <span>{product.name}</span>
                              <span className="font-medium text-blue-700">
                                {Number(product.price).toFixed(2)} ₺
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-gray-400">Henüz ürün eklenmemiş</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
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
          </div>
        </>
      )}
    </div>
  )
}
