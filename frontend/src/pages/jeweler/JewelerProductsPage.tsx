import { FormEvent, useCallback, useEffect, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import {
  createJewelryProduct,
  deleteJewelryProduct,
  getJewelryCategories,
  getJewelryProducts,
  type JewelryCategory,
  type JewelryProduct,
} from '../../api/jeweler'

export default function JewelerProductsPage() {
  const [products, setProducts] = useState<JewelryProduct[]>([])
  const [categories, setCategories] = useState<JewelryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [weightGram, setWeightGram] = useState('')
  const [karat, setKarat] = useState('22')
  const [stockQuantity, setStockQuantity] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [productList, categoryList] = await Promise.all([
        getJewelryProducts(),
        getJewelryCategories(),
      ])
      setProducts(productList)
      setCategories(categoryList)
    } catch {
      setError('Ürünler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await createJewelryProduct({
        name: name.trim(),
        sale_price: salePrice,
        weight_gram: weightGram || '0',
        karat: Number(karat),
        stock_quantity: Number(stockQuantity),
        metal_type: 'gold',
      })
      setName('')
      setSalePrice('')
      setWeightGram('')
      setStockQuantity('1')
      await load()
    } catch {
      setError('Ürün eklenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    try {
      await deleteJewelryProduct(id)
      await load()
    } catch {
      setError('Ürün silinemedi.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ürün Yönetimi" description="Kuyumcu ürün kataloğunu yönetin" />

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Yeni Ürün">
          <form onSubmit={handleSubmit} className="grid gap-3">
            <Input label="Ürün Adı" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Ayar" type="number" value={karat} onChange={(e) => setKarat(e.target.value)} />
            <Input label="Gram" type="number" step="0.001" value={weightGram} onChange={(e) => setWeightGram(e.target.value)} />
            <Input label="Satış Fiyatı (₺)" type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required />
            <Input label="Başlangıç Stok" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
            <Button type="submit" disabled={submitting}>{submitting ? 'Kaydediliyor...' : 'Ürün Ekle'}</Button>
          </form>
        </Card>

        <Card title={`Ürün Listesi (${products.length})`}>
          {categories.length === 0 && (
            <p className="mb-3 text-xs text-slate-500">Kategori eklemek için API üzerinden kategori oluşturabilirsiniz.</p>
          )}
          <ul className="divide-y divide-slate-100">
            {products.map((product) => (
              <li key={product.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {product.karat} ayar · {product.weight_gram} gr · Stok: {product.stock_quantity}
                  </p>
                  {product.barcode && (
                    <p className="text-xs font-mono text-amber-700">{product.barcode}</p>
                  )}
                  <p className="text-sm font-medium text-brand-700">
                    {Number(product.sale_price).toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <button type="button" onClick={() => void handleDelete(product.id)} className="text-xs text-red-600 hover:underline">
                  Sil
                </button>
              </li>
            ))}
            {products.length === 0 && !loading && (
              <li className="py-6 text-center text-sm text-slate-500">Henüz ürün yok.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
