import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../Button'
import Card from '../Card'
import BarcodeScannerModal from './BarcodeScannerModal'
import JewelrySaleItemModal from './JewelrySaleItemModal'
import SaleStockProductPicker from './SaleStockProductPicker'
import LoadingState from '../LoadingState'
import Select from '../Select'
import Textarea from '../Textarea'
import {
  createJewelrySale,
  getJewelryCategories,
  getJewelryCustomers,
  getJewelryProducts,
  getMarketGoldPricesLatest,
  lookupBarcode,
  type JewelryCategory,
  type JewelryCustomer,
  type JewelryProduct,
  type MarketGoldPriceRecord,
} from '../../api/jeweler'
import { useJewelrySaleCart } from '../../context/JewelrySaleCartContext'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import {
  calculateSaleLineMarketValue,
  calculateSaleLineTotal,
  calculateSaleSummary,
  createEmptyPurchaseItem,
  createQuickGoldItem,
  createSaleItemFromProduct,
  getAvailableProductStock,
  getQuickGoldAvailableStock,
  GOLD_PURCHASE_QUICK_TYPES,
  pickProductForQuickGoldSale,
  type GoldPurchaseQuickType,
  type SaleFormItem,
} from '../../utils/jewelrySaleGold'
import { formatMoneyInputFromNumber, parseMoneyInput } from '../../utils/moneyInput'

interface JewelerSaleFormSectionProps {
  scannerOpen?: boolean
  onScannerOpenChange?: (open: boolean) => void
}

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'card', label: 'Kart' },
  { value: 'transfer', label: 'Havale/EFT' },
  { value: 'gold_exchange', label: 'Altın Takas' },
]

export default function JewelerSaleFormSection({
  scannerOpen: scannerOpenProp,
  onScannerOpenChange,
}: JewelerSaleFormSectionProps) {
  const { notifySaleCompleted } = useJewelrySaleCart()

  const [customers, setCustomers] = useState<JewelryCustomer[]>([])
  const [products, setProducts] = useState<JewelryProduct[]>([])
  const [categories, setCategories] = useState<JewelryCategory[]>([])
  const [goldPrices, setGoldPrices] = useState<MarketGoldPriceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [internalScannerOpen, setInternalScannerOpen] = useState(false)
  const [scanning, setScanning] = useState(false)

  const scannerOpen = onScannerOpenChange ? (scannerOpenProp ?? false) : internalScannerOpen
  const setScannerOpen = onScannerOpenChange ?? setInternalScannerOpen

  const [customerId, setCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<SaleFormItem[]>([])

  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [itemModalMode, setItemModalMode] = useState<'quick-gold' | 'custom'>('custom')
  const [itemModalQuickType, setItemModalQuickType] = useState<GoldPurchaseQuickType | null>(null)
  const [editingItem, setEditingItem] = useState<SaleFormItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [customerData, productData, categoryData, goldResponse] = await Promise.all([
        getJewelryCustomers(),
        getJewelryProducts(),
        getJewelryCategories(),
        getMarketGoldPricesLatest(),
      ])
      setCustomers(customerData)
      setProducts(productData)
      setCategories(categoryData)
      setGoldPrices(goldResponse.prices)
    } catch {
      setError('Satış verileri yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
     void load()
  }, [load])

  const saleSummary = useMemo(
    () => calculateSaleSummary(items, goldPrices),
    [items, goldPrices],
  )

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const resetForm = () => {
    setCustomerId('')
    setPaymentMethod('cash')
    setNotes('')
    setItems([])
  }

  const findCategoryId = (categoryName: string) => (
    categories.find((category) => category.name === categoryName)?.id
  )

  const saveItem = (item: SaleFormItem) => {
    let nextItem = { ...item }

    if (item.gold_type) {
      const quickType = GOLD_PURCHASE_QUICK_TYPES.find(
        (type) => type.goldType === item.gold_type && type.defaultDescription === item.item_description,
      )

      if (quickType) {
        const otherItems = items.filter((row) => row.key !== item.key)
        const product = pickProductForQuickGoldSale(quickType, products, categories, otherItems)

        if (!product) {
          setError(`"${quickType.label}" için stok yetersiz.`)
          return
        }

        nextItem = {
          ...nextItem,
          product_id: String(product.id),
          weight_gram: String(product.weight_gram),
          unit_price: parseMoneyInput(nextItem.unit_price) > 0
            ? nextItem.unit_price
            : formatMoneyInputFromNumber(product.sale_price),
        }
      }
    }

    setError(null)
    setItems((current) => {
      const exists = current.some((row) => row.key === nextItem.key)
      if (exists) {
        return current.map((row) => (row.key === nextItem.key ? nextItem : row))
      }
      return [...current, nextItem]
    })
  }

  const addProductToSale = (product: JewelryProduct) => {
    const available = getAvailableProductStock(product, items)
    if (available < 1) {
      setError(`"${product.name}" için yeterli stok yok.`)
      return
    }

    setError(null)

    const existing = items.find((item) => item.product_id === String(product.id))
    if (existing) {
      saveItem({
        ...existing,
        quantity: String(Number(existing.quantity) + 1),
      })
      return
    }

    saveItem(createSaleItemFromProduct(product))
  }

  const handleBarcodeScan = async (code: string) => {
    setScannerOpen(false)
    setScanning(true)
    setError(null)

    try {
      const product = await lookupBarcode(code)
      addProductToSale(product)
    } catch {
      setError('Barkoda ait ürün bulunamadı.')
    } finally {
      setScanning(false)
    }
  }

  const openQuickGoldModal = (quickType: GoldPurchaseQuickType) => {
    const available = getQuickGoldAvailableStock(quickType, products, categories, items)
    if (available < 1) {
      setError(`"${quickType.label}" için stok yok. Satış yapılamaz.`)
      return
    }

    setError(null)
    const categoryId = findCategoryId(quickType.categoryName)
    const item = createQuickGoldItem(
      quickType,
      categoryId ? String(categoryId) : '',
    )
    const product = pickProductForQuickGoldSale(quickType, products, categories, items)

    if (product) {
      item.product_id = String(product.id)
      item.weight_gram = String(product.weight_gram)
      item.unit_price = formatMoneyInputFromNumber(product.sale_price)
    }

    setEditingItem(item)
    setItemModalMode('quick-gold')
    setItemModalQuickType(quickType)
    setItemModalOpen(true)
  }

  const openEditItemModal = (item: SaleFormItem) => {
    const quickType = GOLD_PURCHASE_QUICK_TYPES.find(
      (type) => type.goldType === item.gold_type && type.defaultDescription === item.item_description,
    ) ?? null

    setEditingItem(item)
    setItemModalMode(quickType ? 'quick-gold' : 'custom')
    setItemModalQuickType(quickType)
    setItemModalOpen(true)
  }

  const openCustomItemModal = () => {
    setEditingItem(createEmptyPurchaseItem())
    setItemModalMode('custom')
    setItemModalQuickType(null)
    setItemModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const validItems = items.filter((item) => item.item_description.trim())
    if (validItems.length === 0) {
      setError('En az bir ürün ekleyin.')
      return
    }

    for (const item of validItems) {
      if (calculateSaleLineTotal(item) <= 0) {
        setError(`"${item.item_description}" için geçerli satış fiyatı girin.`)
        return
      }

      if (item.gold_type && !item.product_id) {
        setError(`"${item.item_description}" için stok bağlantısı yapılamadı.`)
        return
      }

      if (item.product_id) {
        const product = productById.get(Number(item.product_id))
        if (product) {
          const quantity = Math.max(1, Number(item.quantity) || 1)
          const reservedOthers = validItems
            .filter((row) => row.product_id === item.product_id && row.key !== item.key)
            .reduce((sum, row) => sum + Math.max(1, Number(row.quantity) || 1), 0)

          if (reservedOthers + quantity > product.stock_quantity) {
            setError(`"${product.name}" için stok yetersiz.`)
            return
          }
        }
      }
    }

    setSubmitting(true)

    const payload = {
      customer_id: customerId ? Number(customerId) : null,
      payment_method: paymentMethod,
      notes: notes.trim() || undefined,
      items: validItems.map((item) => {
        const product = item.product_id ? productById.get(Number(item.product_id)) : undefined

        return {
          product_id: item.product_id ? Number(item.product_id) : null,
          product_name: item.item_description.trim(),
          quantity: Math.max(1, Number(item.quantity) || 1),
          unit_price: parseMoneyInput(item.unit_price) || 0,
          weight_gram: product?.weight_gram ?? (item.pricing_mode === 'gram' ? Number(item.weight_gram) || 0 : null),
          labor_cost: product ? Number(product.labor_cost) : 0,
          line_total: calculateSaleLineTotal(item),
        }
      }),
    }

    try {
      await createJewelrySale(payload)
      notifySaleCompleted('Satış kaydedildi.')
      resetForm()
      await load()
    } catch {
      setError('Satış kaydı oluşturulamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  const customerOptions = [
    { value: '', label: 'Müşteri seçin (opsiyonel)' },
    ...customers.map((customer) => ({ value: String(customer.id), label: customer.name })),
  ]

  const totalItemCount = items.reduce(
    (sum, item) => sum + Math.max(1, Number(item.quantity) || 1),
    0,
  )

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      {error && <p className="alert-error">{error}</p>}
      {scanning && (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Barkod okunuyor...
        </p>
      )}

      <Card title="Müşteriye Satış">
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Müşteri"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              options={customerOptions}
            />
            <Select
              label="Ödeme Yöntemi"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              options={PAYMENT_OPTIONS}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Hızlı Satış</p>
            <p className="text-xs text-slate-500">Gram, çeyrek, yarım, tam, ata ve cumhuriyet altını hızlıca ekleyin.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GOLD_PURCHASE_QUICK_TYPES.map((quickType) => {
                const available = getQuickGoldAvailableStock(quickType, products, categories, items)

                return (
                  <Button
                    key={quickType.key}
                    type="button"
                    variant="secondary"
                    disabled={available < 1}
                    className="flex h-auto w-full flex-col gap-1 py-3"
                    onClick={() => openQuickGoldModal(quickType)}
                  >
                    <span>{quickType.label}</span>
                    <span className={`text-xs font-medium ${available > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {available > 0 ? `${available} adet` : 'Stok yok'}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <SaleStockProductPicker
              products={products}
              categories={categories}
              saleItems={items}
              onSelect={addProductToSale}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-800">
              Satılacak ürünler ({totalItemCount})
            </p>
            <Button type="button" size="sm" onClick={() => openCustomItemModal()}>
              Ürün Ekle
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500">
              Henüz ürün yok. Stoktan seçin, barkod okutun veya hızlı satış ile ekleyin.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((item, index) => {
                const total = calculateSaleLineTotal(item)
                const market = calculateSaleLineMarketValue(item, goldPrices)
                const linkedProduct = item.product_id
                  ? productById.get(Number(item.product_id))
                  : undefined
                const catalogPrice = linkedProduct ? Number(linkedProduct.sale_price) : 0
                const referenceValue = market > 0 ? market : catalogPrice * Math.max(1, Number(item.quantity) || 1)
                const difference = Math.round((total - referenceValue) * 100) / 100

                return (
                  <li
                    key={item.key}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{item.item_description}</p>
                          {linkedProduct && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              Stok
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.pricing_mode === 'gram'
                            ? `${item.weight_gram} gr · ${item.quantity} adet`
                            : `${item.quantity} adet`}
                          {item.karat ? ` · ${item.karat} ayar` : ''}
                          {linkedProduct?.barcode ? ` · ${linkedProduct.barcode}` : ''}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs">
                          <span className="font-medium text-brand-700">
                            Tahsil: {formatJewelryMoney(total)}
                          </span>
                          {referenceValue > 0 && (
                            <>
                              <span className="text-slate-500">
                                {market > 0 ? 'Piyasa' : 'Liste'}: {formatJewelryMoney(referenceValue)}
                              </span>
                              <span className={`font-semibold ${difference >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {difference >= 0 ? '+' : ''}{formatJewelryMoney(difference)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => openEditItemModal(item)}
                          className="text-xs font-semibold text-brand-700 hover:underline"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Kaldır
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">Kalem {index + 1}</p>
                  </li>
                )
              })}
            </ul>
          )}

          <Textarea
            label="Not"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />

          <div className="space-y-2 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-brand-900">Toplam tahsilat</span>
              <span className="text-lg font-bold text-brand-700">
                {formatJewelryMoney(saleSummary.totalRevenue)}
              </span>
            </div>
            {saleSummary.marketValue > 0 && (
              <>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-brand-800">Güncel piyasa değeri</span>
                  <span className="font-semibold text-slate-900">
                    {formatJewelryMoney(saleSummary.marketValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-brand-100 pt-2 text-sm">
                  <span className="font-medium text-brand-900">
                    {saleSummary.difference >= 0 ? 'Piyasa üzeri satış' : 'Piyasa altı satış'}
                  </span>
                  <span className={`font-bold ${saleSummary.difference >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {saleSummary.difference >= 0 ? '+' : ''}{formatJewelryMoney(saleSummary.difference)}
                    {saleSummary.difference !== 0 && saleSummary.differencePercent !== 0 && (
                      <span className="ml-1 text-xs font-semibold">
                        (%{Math.abs(saleSummary.differencePercent).toFixed(1)})
                      </span>
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting || items.length === 0}>
              {submitting ? 'Kaydediliyor...' : 'Satış Kaydet'}
            </Button>
          </div>
        </form>
      </Card>

      {itemModalOpen && editingItem && (
        <JewelrySaleItemModal
          item={editingItem}
          quickType={itemModalQuickType}
          mode={itemModalMode}
          categories={categories}
          products={products}
          goldPrices={goldPrices}
          onClose={() => {
            setItemModalOpen(false)
            setEditingItem(null)
          }}
          onSave={saveItem}
        />
      )}

      {scannerOpen && (
        <BarcodeScannerModal
          onScan={(code) => void handleBarcodeScan(code)}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}
