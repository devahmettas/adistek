import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ImageUploadField from '../../components/ImageUploadField'
import Input from '../../components/Input'
import JewelryProductDetailModal from '../../components/jeweler/JewelryProductDetailModal'
import JewelryProductSaleModal from '../../components/jeweler/JewelryProductSaleModal'
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

type ProductsTab = 'list' | 'add' | 'edit'
type CategoryFilter = 'all' | 'uncategorized' | number

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

function populateFormFromProduct(product: JewelryProduct) {
  return {
    name: product.name,
    categoryId: product.category_id ? String(product.category_id) : '',
    karat: String(product.karat ?? 22),
    weightGram: product.weight_gram,
    laborCost: product.labor_cost,
    profitRate: product.profit_rate ?? '0',
    description: product.description ?? '',
    stockQuantity: String(product.stock_quantity),
    isManualPrice: product.is_manual_price,
    manualPrice: product.sale_price,
    imagePath: product.image_path,
    imageUrl: resolveMenuAssetUrl(null, product.image_path),
  }
}

interface ProductFormProps {
  editingId: number | null
  name: string
  setName: (value: string) => void
  categoryId: string
  setCategoryId: (value: string) => void
  karat: string
  setKarat: (value: string) => void
  weightGram: string
  setWeightGram: (value: string) => void
  laborCost: string
  setLaborCost: (value: string) => void
  profitRate: string
  setProfitRate: (value: string) => void
  description: string
  setDescription: (value: string) => void
  stockQuantity: string
  setStockQuantity: (value: string) => void
  isManualPrice: boolean
  setIsManualPrice: (value: boolean) => void
  manualPrice: string
  setManualPrice: (value: string) => void
  imagePath: string | null
  imageUrl: string | null
  setImagePath: (value: string | null) => void
  setImageUrl: (value: string | null) => void
  categories: JewelryCategory[]
  newCategoryName: string
  setNewCategoryName: (value: string) => void
  addingCategory: boolean
  onAddCategory: () => void
  formError: string | null
  submitting: boolean
  onSubmit: (event: FormEvent) => void
  onCancel?: () => void
  priceBreakdown: JewelryPriceBreakdown | null
}

function ProductForm({
  editingId,
  name,
  setName,
  categoryId,
  setCategoryId,
  karat,
  setKarat,
  weightGram,
  setWeightGram,
  laborCost,
  setLaborCost,
  profitRate,
  setProfitRate,
  description,
  setDescription,
  stockQuantity,
  setStockQuantity,
  isManualPrice,
  setIsManualPrice,
  manualPrice,
  setManualPrice,
  imagePath,
  imageUrl,
  setImagePath,
  setImageUrl,
  categories,
  newCategoryName,
  setNewCategoryName,
  addingCategory,
  onAddCategory,
  formError,
  submitting,
  onSubmit,
  onCancel,
  priceBreakdown,
}: ProductFormProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card title={editingId ? 'Ürün Bilgileri' : 'Yeni Ürün'}>
        <form onSubmit={onSubmit} className="space-y-4">
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
                onClick={onAddCategory}
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
            rows={4}
          />

          <ImageUploadField
            label="Fotoğraf"
            context="product"
            module="jeweler"
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
              {submitting ? 'Kaydediliyor...' : editingId ? 'Değişiklikleri Kaydet' : 'Ürün Ekle'}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
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
              <dt className="text-slate-500">Kar payı ({priceBreakdown.profitRate}%)</dt>
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
  )
}

export default function JewelerProductsPage() {
  const [products, setProducts] = useState<JewelryProduct[]>([])
  const [categories, setCategories] = useState<JewelryCategory[]>([])
  const [goldPrices, setGoldPrices] = useState<MarketGoldPriceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ProductsTab>('list')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailProduct, setDetailProduct] = useState<JewelryProduct | null>(null)
  const [saleProduct, setSaleProduct] = useState<JewelryProduct | null>(null)

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
    if (isManualPrice) return null

    const gram = Number(weightGram)
    const labor = Number(laborCost) || 0
    const profit = Number(profitRate) || 0

    if (!gram || gram <= 0) return null

    return calculateJewelryPrice(gram, Number(karat), labor, profit, goldPrices)
  }, [isManualPrice, weightGram, karat, laborCost, profitRate, goldPrices])

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const detailGoldPricePerGram = useMemo(() => {
    if (!detailProduct) return null
    const breakdown = calculateJewelryPrice(
      1,
      detailProduct.karat ?? 22,
      0,
      0,
      goldPrices,
    )
    return breakdown?.goldPricePerGram ?? null
  }, [detailProduct, goldPrices])

  const categoryCounts = useMemo(() => {
    const counts = new Map<CategoryFilter, number>()
    counts.set('all', products.length)
    counts.set(
      'uncategorized',
      products.filter((product) => !product.category_id).length,
    )

    categories.forEach((category) => {
      counts.set(
        category.id,
        products.filter((product) => product.category_id === category.id).length,
      )
    })

    return counts
  }, [products, categories])

  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'all') return products
    if (categoryFilter === 'uncategorized') {
      return products.filter((product) => !product.category_id)
    }
    return products.filter((product) => product.category_id === categoryFilter)
  }, [products, categoryFilter])

  const editingProduct = useMemo(
    () => (editingId ? products.find((product) => product.id === editingId) ?? null : null),
    [editingId, products],
  )

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

  const applyProductToForm = (product: JewelryProduct) => {
    const form = populateFormFromProduct(product)
    setEditingId(product.id)
    setName(form.name)
    setCategoryId(form.categoryId)
    setKarat(form.karat)
    setWeightGram(form.weightGram)
    setLaborCost(form.laborCost)
    setProfitRate(form.profitRate)
    setDescription(form.description)
    setStockQuantity(form.stockQuantity)
    setIsManualPrice(form.isManualPrice)
    setManualPrice(form.manualPrice)
    setImagePath(form.imagePath)
    setImageUrl(form.imageUrl)
    setFormError(null)
  }

  const startEdit = (product: JewelryProduct) => {
    applyProductToForm(product)
    setDetailProduct(null)
    setActiveTab('edit')
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
      if (detailProduct?.id === id) {
        setDetailProduct(null)
      }
      await load()
    } catch {
      setError('Ürün silinemedi.')
    }
  }

  const formProps = {
    editingId,
    name,
    setName,
    categoryId,
    setCategoryId,
    karat,
    setKarat,
    weightGram,
    setWeightGram,
    laborCost,
    setLaborCost,
    profitRate,
    setProfitRate,
    description,
    setDescription,
    stockQuantity,
    setStockQuantity,
    isManualPrice,
    setIsManualPrice,
    manualPrice,
    setManualPrice,
    imagePath,
    imageUrl,
    setImagePath,
    setImageUrl,
    categories,
    newCategoryName,
    setNewCategoryName,
    addingCategory,
    onAddCategory: () => void handleAddCategory(),
    formError,
    submitting,
    onSubmit: handleSubmit,
    priceBreakdown,
  }

  const filterChips: Array<{ id: CategoryFilter; label: string }> = [
    { id: 'all', label: 'Tümü' },
    ...categories.map((category) => ({
      id: category.id as CategoryFilter,
      label: category.name,
    })),
  ]

  if ((categoryCounts.get('uncategorized') ?? 0) > 0) {
    filterChips.push({ id: 'uncategorized', label: 'Kategorisiz' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ürün Yönetimi"
        description="Ürünleri listeleyin, kategorilere göre filtreleyin, detaylarını görüntüleyin ve düzenleyin."
      />

      <PageSubNav
        items={[
          { id: 'list', label: 'Ürün Listesi' },
          { id: 'add', label: 'Ürün Ekle' },
          { id: 'edit', label: 'Ürün Düzenle' },
        ]}
        activeId={activeTab}
        onChange={(id) => {
          const tab = id as ProductsTab
          if (tab === 'add') {
            resetForm()
          }
          if (tab === 'list') {
            resetForm()
          }
          setActiveTab(tab)
        }}
      />

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {!loading && activeTab === 'list' && (
        <Card title={`Ürün Listesi (${filteredProducts.length})`}>
          <div className="mb-5 flex flex-wrap gap-2">
            {filterChips.map((chip) => {
              const count = categoryCounts.get(chip.id) ?? 0
              const isActive = categoryFilter === chip.id

              return (
                <button
                  key={String(chip.id)}
                  type="button"
                  onClick={() => setCategoryFilter(chip.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {chip.label}
                  <span className={`ml-1.5 ${isActive ? 'text-brand-100' : 'text-slate-500'}`}>
                    ({count})
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const previewUrl = resolveMenuAssetUrl(null, product.image_path)
              const categoryName = product.category_id
                ? categoryNameById.get(product.category_id)
                : null

              return (
                <article
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setDetailProduct(product)}
                    className="flex flex-1 cursor-pointer flex-col text-left"
                  >
                    <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/40 p-4">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain object-center transition group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
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
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {product.description || `${product.weight_gram} gr · Stok: ${product.stock_quantity}`}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold text-brand-700">
                          {formatJewelryMoney(product.sale_price)}
                        </p>
                        <p className="text-xs text-slate-500">Stok: {product.stock_quantity}</p>
                      </div>
                    </div>
                  </button>
                  <div className="flex gap-2 border-t border-slate-100 p-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => startEdit(product)}
                    >
                      Düzenle
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      className="flex-1"
                      onClick={() => void handleDelete(product.id)}
                    >
                      Sil
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              {categoryFilter === 'all' ? 'Henüz ürün yok.' : 'Bu kategoride ürün bulunamadı.'}
            </p>
          )}
        </Card>
      )}

      {!loading && activeTab === 'add' && (
        <ProductForm {...formProps} />
      )}

      {!loading && activeTab === 'edit' && (
        editingProduct ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-900">
              <span className="font-semibold">{editingProduct.name}</span> düzenleniyor
            </div>
            <ProductForm
              {...formProps}
              onCancel={() => {
                resetForm()
                setActiveTab('list')
              }}
            />
          </div>
        ) : (
          <Card title="Düzenlenecek Ürün Seçin">
            <p className="mb-4 text-sm text-slate-500">
              Aşağıdan bir ürün seçerek düzenleme formunu açabilirsiniz.
            </p>
            <ul className="divide-y divide-slate-100">
              {products.map((product) => {
                const categoryName = product.category_id
                  ? categoryNameById.get(product.category_id)
                  : null

                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => applyProductToForm(product)}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">
                          {categoryName ?? 'Kategorisiz'} · {product.weight_gram} gr
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-brand-700">
                        {formatJewelryMoney(product.sale_price)}
                      </span>
                    </button>
                  </li>
                )
              })}
              {products.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-500">Henüz ürün yok.</li>
              )}
            </ul>
          </Card>
        )
      )}

      {detailProduct && (
        <JewelryProductDetailModal
          product={detailProduct}
          categoryName={
            detailProduct.category_id
              ? categoryNameById.get(detailProduct.category_id)
              : null
          }
          goldPricePerGram={detailGoldPricePerGram}
          onClose={() => setDetailProduct(null)}
          onSell={() => {
            setSaleProduct(detailProduct)
            setDetailProduct(null)
          }}
        />
      )}

      {saleProduct && (
        <JewelryProductSaleModal
          product={saleProduct}
          goldPrices={goldPrices}
          onClose={() => setSaleProduct(null)}
          onSuccess={() => void load()}
        />
      )}
    </div>
  )
}
