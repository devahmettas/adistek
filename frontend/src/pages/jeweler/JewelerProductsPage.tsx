import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ImageUploadField from '../../components/ImageUploadField'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import PageSubNav from '../../components/PageSubNav'
import Select from '../../components/Select'
import Textarea from '../../components/Textarea'
import {
  createJewelryCategory,
  createJewelryProduct,
  deleteJewelryProduct,
  getJewelryCategories,
  getJewelryProducts,
  getMarketGoldPricesLatest,
  updateJewelryProduct,
  type JewelryCategory,
  type JewelryProduct,
  type MarketGoldPriceRecord,
} from '../../api/jeweler'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'
import {
  calculateJewelryPrice,
  formatJewelryMoney,
  KARAT_OPTIONS,
  type JewelryPriceBreakdown,
} from '../../utils/jewelryPrice'

type ProductsTab = 'list' | 'add'

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  karat: '22',
  weightGram: '',
  laborCost: '',
  profitRate: '',
  description: '',
  stockQuantity: '1',
  isManualPrice: false,
  manualPrice: '',
}

export default function JewelerProductsPage() {
  const [products, setProducts] = useState<JewelryProduct[]>([])
  const [categories, setCategories] = useState<JewelryCategory[]>([])
  const [goldPrices, setGoldPrices] = useState<MarketGoldPriceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ProductsTab>('list')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [name, setName] = useState(EMPTY_FORM.name)
  const [categoryId, setCategoryId] = useState(EMPTY_FORM.categoryId)
  const [karat, setKarat] = useState(EMPTY_FORM.karat)
  const [weightGram, setWeightGram] = useState(EMPTY_FORM.weightGram)
  const [laborCost, setLaborCost] = useState(EMPTY_FORM.laborCost)
  const [profitRate, setProfitRate] = useState(EMPTY_FORM.profitRate)
  const [description, setDescription] = useState(EMPTY_FORM.description)
  const [stockQuantity, setStockQuantity] = useState(EMPTY_FORM.stockQuantity)
  const [isManualPrice, setIsManualPrice] = useState(EMPTY_FORM.isManualPrice)
  const [manualPrice, setManualPrice] = useState(EMPTY_FORM.manualPrice)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [productList, categoryList, goldPriceData] = await Promise.all([
        getJewelryProducts(),
        getJewelryCategories(),
        getMarketGoldPricesLatest(),
      ])
      setProducts(productList)
      setCategories(categoryList)
      setGoldPrices(goldPriceData.prices)
    } catch {
      setError('Ürünler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const priceBreakdown = useMemo<JewelryPriceBreakdown | null>(() => {
    if (isManualPrice) {
      return null
    }

    const gram = Number(weightGram)
    const labor = Number(laborCost) || 0
    const profit = Number(profitRate) || 0

    if (!gram || gram <= 0) {
      return null
    }

    return calculateJewelryPrice(gram, Number(karat), labor, profit, goldPrices)
  }, [isManualPrice, weightGram, karat, laborCost, profitRate, goldPrices])

  const resetForm = () => {
    setName(EMPTY_FORM.name)
    setCategoryId(EMPTY_FORM.categoryId)
    setKarat(EMPTY_FORM.karat)
    setWeightGram(EMPTY_FORM.weightGram)
    setLaborCost(EMPTY_FORM.laborCost)
    setProfitRate(EMPTY_FORM.profitRate)
    setDescription(EMPTY_FORM.description)
    setStockQuantity(EMPTY_FORM.stockQuantity)
    setIsManualPrice(EMPTY_FORM.isManualPrice)
    setManualPrice(EMPTY_FORM.manualPrice)
    setImagePath(null)
    setImageUrl(null)
    setEditingId(null)
    setFormError(null)
  }

  const startEdit = (product: JewelryProduct) => {
    setEditingId(product.id)
    setName(product.name)
    setCategoryId(product.category_id ? String(product.category_id) : '')
    setKarat(String(product.karat ?? 22))
    setWeightGram(product.weight_gram)
    setLaborCost(product.labor_cost)
    setProfitRate(product.profit_rate ?? '0')
    setDescription(product.description ?? '')
    setStockQuantity(String(product.stock_quantity))
    setIsManualPrice(product.is_manual_price)
    setManualPrice(product.sale_price)
    setImagePath(product.image_path)
    setImageUrl(resolveMenuAssetUrl(null, product.image_path))
    setFormError(null)
    setActiveTab('add')
  }

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return

    setAddingCategory(true)
    try {
      const category = await createJewelryCategory({ name: trimmed })
      setCategories((prev) => [...prev, category])
      setCategoryId(String(category.id))
      setNewCategoryName('')
    } catch {
      setFormError('Kategori eklenemedi.')
    } finally {
      setAddingCategory(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('Ürün adı zorunludur.')
      return
    }

    if (!isManualPrice && !priceBreakdown) {
      setFormError('Otomatik fiyat hesaplanamadı. Gram ve ayar bilgilerini kontrol edin veya manuel fiyat girin.')
      return
    }

    if (isManualPrice) {
      const price = Number(manualPrice)
      if (Number.isNaN(price) || price < 0) {
        setFormError('Geçerli bir manuel fiyat girin.')
        return
      }
    }

    setSubmitting(true)

    const payload = {
      name: name.trim(),
      category_id: categoryId ? Number(categoryId) : null,
      karat: Number(karat),
      weight_gram: weightGram || '0',
      labor_cost: laborCost || '0',
      profit_rate: profitRate || '0',
      description: description.trim() || null,
      image_path: imagePath,
      is_manual_price: isManualPrice,
      sale_price: isManualPrice ? manualPrice : String(priceBreakdown?.salePrice ?? 0),
      metal_type: 'gold' as const,
      ...(editingId ? {} : { stock_quantity: Number(stockQuantity) || 0 }),
    }

    try {
      if (editingId) {
        await updateJewelryProduct(editingId, payload)
      } else {
        await createJewelryProduct(payload)
      }
      resetForm()
      setActiveTab('list')
      await load()
    } catch {
      setFormError(editingId ? 'Ürün güncellenemedi.' : 'Ürün eklenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    try {
      await deleteJewelryProduct(id)
      if (editingId === id) {
        resetForm()
        setActiveTab('list')
      }
      await load()
    } catch {
      setError('Ürün silinemedi.')
    }
  }

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ürün Yönetimi"
        description="Ürün ekleyin, altın fiyatına göre otomatik fiyat hesaplayın veya manuel fiyat girin."
      />

      <PageSubNav
        items={[
          { id: 'list', label: 'Ürün Listesi' },
          { id: 'add', label: editingId ? 'Ürün Düzenle' : 'Ürün Ekle' },
        ]}
        activeId={activeTab}
        onChange={(id) => {
          if (id === 'list') {
            resetForm()
          }
          setActiveTab(id as ProductsTab)
        }}
      />

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {!loading && activeTab === 'list' && (
        <Card title={`Ürün Listesi (${products.length})`}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const previewUrl = resolveMenuAssetUrl(null, product.image_path)
              const categoryName = product.category_id
                ? categoryNameById.get(product.category_id)
                : null

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="aspect-[4/3] bg-slate-50">
                    {previewUrl ? (
                      <img src={previewUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Fotoğraf yok
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                        {categoryName && (
                          <p className="text-xs text-slate-500">{categoryName}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {product.karat} ayar
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {product.weight_gram} gr · İşçilik: {formatJewelryMoney(product.labor_cost)}
                      {Number(product.profit_rate) > 0 && ` · Kar: %${product.profit_rate}`}
                    </p>
                    {product.barcode && (
                      <p className="font-mono text-xs text-amber-700">{product.barcode}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-brand-700">
                        {formatJewelryMoney(product.sale_price)}
                      </p>
                      <p className="text-xs text-slate-500">Stok: {product.stock_quantity}</p>
                    </div>
                    {product.is_manual_price && (
                      <p className="text-xs text-slate-500">Manuel fiyat</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="text-xs font-medium text-brand-700 hover:underline"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          {products.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">Henüz ürün yok.</p>
          )}
        </Card>
      )}

      {!loading && activeTab === 'add' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card title={editingId ? 'Ürün Düzenle' : 'Yeni Ürün'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Ürün Adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Kategori"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={[
                    { value: '', label: 'Kategori seçin' },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                />
                <Select
                  label="Ayar"
                  value={karat}
                  onChange={(e) => setKarat(e.target.value)}
                  options={KARAT_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              </div>

              <div className="flex gap-2">
                <Input
                  label="Yeni Kategori"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Örn: Bilezik"
                  className="flex-1"
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={addingCategory || !newCategoryName.trim()}
                    onClick={() => void handleAddCategory()}
                  >
                    {addingCategory ? '...' : 'Ekle'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Gram"
                  type="number"
                  step="0.001"
                  min="0"
                  value={weightGram}
                  onChange={(e) => setWeightGram(e.target.value)}
                  required
                />
                <Input
                  label="İşçilik (₺)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                />
              </div>

              <Input
                label="Kar Oranı (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={profitRate}
                onChange={(e) => setProfitRate(e.target.value)}
                placeholder="Örn: 15"
              />

              <Textarea
                label="Açıklama"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              <ImageUploadField
                label="Fotoğraf"
                context="product"
                imagePath={imagePath}
                imageUrl={imageUrl}
                onChange={({ path, url }) => {
                  setImagePath(path)
                  setImageUrl(url)
                }}
              />

              {!editingId && (
                <Input
                  label="Başlangıç Stok"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isManualPrice}
                    onChange={(e) => setIsManualPrice(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">Manuel fiyat gir</span>
                </label>

                {isManualPrice ? (
                  <div className="mt-3">
                    <Input
                      label="Manuel Satış Fiyatı (₺)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Fiyat otomatik hesaplanır: (Gram × Güncel Altın Fiyatı) + İşçilik + Kar Payı
                  </p>
                )}
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Ürün Ekle'}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    İptal
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <Card title="Fiyat Hesaplama">
            {isManualPrice ? (
              <p className="text-sm text-slate-500">
                Manuel fiyat modu aktif. Otomatik hesaplama devre dışı.
              </p>
            ) : priceBreakdown ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Güncel altın (gr)</dt>
                  <dd className="font-medium text-slate-900">
                    {formatJewelryMoney(priceBreakdown.goldPricePerGram)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Altın değeri</dt>
                  <dd className="font-medium text-slate-900">
                    {formatJewelryMoney(priceBreakdown.metalValue)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">İşçilik</dt>
                  <dd className="font-medium text-slate-900">
                    {formatJewelryMoney(priceBreakdown.laborCost)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">
                    Kar payı ({priceBreakdown.profitRate}%)
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {formatJewelryMoney(priceBreakdown.profitAmount)}
                  </dd>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-slate-900">Ürün Fiyatı</dt>
                    <dd className="text-xl font-bold text-brand-700">
                      {formatJewelryMoney(priceBreakdown.salePrice)}
                    </dd>
                  </div>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-500">
                Gram ve ayar bilgisi girildiğinde fiyat otomatik hesaplanır.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
