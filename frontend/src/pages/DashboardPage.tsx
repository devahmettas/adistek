import { FormEvent, useState } from 'react'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import ProductList from '../components/ProductList'
import TableGrid from '../components/TableGrid'
import WaiterList from '../components/WaiterList'
import Select from '../components/Select'
import Textarea from '../components/Textarea'
import useDashboard from '../hooks/useDashboard'
import useNow from '../hooks/useNow'
import { useAuth } from '../store/AuthStore'

export default function DashboardPage() {
  const { restaurant } = useAuth()
  const {
    categories,
    products,
    tables,
    loading,
    error,
    addCategory,
    addProduct,
    editProduct,
    removeProduct,
    toggleProductStatus,
    addTable,
    assignProductToTable,
    updateTableProductQuantity,
    requestTableBill,
    payTableBill,
  } = useDashboard()
  const now = useNow()

  const [categoryName, setCategoryName] = useState('')
  const [tableName, setTableName] = useState('')
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [tableError, setTableError] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)
  const [submittingCategory, setSubmittingCategory] = useState(false)
  const [submittingTable, setSubmittingTable] = useState(false)
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

          <Card title="Garsonlar">
            <WaiterList />
          </Card>

          <Card title="Masalar">
            <TableGrid
              tables={tables}
              categories={categories}
              products={products}
              now={now}
              onAddProduct={assignProductToTable}
              onUpdateProduct={updateTableProductQuantity}
              onRequestBill={requestTableBill}
              onPayBill={payTableBill}
            />
          </Card>

          <Card title="Ürün Listesi">
            <ProductList
              products={products}
              categories={categories}
              onUpdate={editProduct}
              onDelete={removeProduct}
              onToggleStatus={toggleProductStatus}
            />
          </Card>
        </>
      )}
    </div>
  )
}
