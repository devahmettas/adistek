import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../Button'
import Card from '../Card'
import BarcodeScannerModal from './BarcodeScannerModal'
import JewelryProductSaleModal from './JewelryProductSaleModal'
import JewelrySaleItemModal from './JewelrySaleItemModal'
import JewelerPaymentMethodPicker, { JEWELER_SALE_PAYMENT_OPTIONS } from './JewelerPaymentMethodPicker'
import SaleStockProductPicker from './SaleStockProductPicker'
import LoadingState from '../LoadingState'
import Select from '../Select'
import Textarea from '../Textarea'
import {
  createJewelrySale,
  getJewelryCategories,
  getJewelryCustomers,
  getJewelryProducts,
  getJewelrySale,
  getMarketGoldPricesLatest,
  lookupBarcode,
  updateJewelrySale,
  type JewelryCategory,
  type JewelryCustomer,
  type JewelryProduct,
  type JewelrySale,
  type MarketGoldPriceRecord,
} from '../../api/jeweler'
import { useJewelrySaleCart } from '../../context/JewelrySaleCartContext'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import {
  calculateSaleLineMarketValue,
  calculateSaleLineTotal,
  calculateSaleSummary,
  buildExtraStockFromSaleItems,
  createQuickGoldItem,
  createSaleItemFromProduct,
  getAvailableProductStock,
  getQuickGoldAvailableStock,
  getReservedProductQuantity,
  getSaleItemMaxQuantity,
  GOLD_PURCHASE_QUICK_TYPES,
  pickProductForQuickGoldSale,
  type GoldPurchaseQuickType,
  type SaleFormItem,
} from '../../utils/jewelrySaleGold'
import { formatMoneyInputFromNumber, parseMoneyInput } from '../../utils/moneyInput'

interface JewelerSaleFormSectionProps {
  scannerOpen?: boolean
  onScannerOpenChange?: (open: boolean) => void
  barcodeSearchQuery?: string
  onBarcodeSearchQueryChange?: (value: string) => void
  externalBarcodeCode?: string | null
  onExternalBarcodeHandled?: () => void
  pendingProductId?: number | null
  onPendingProductHandled?: () => void
  editSaleId?: number | null
  onEditSaleHandled?: () => void
  onCatalogLoaded?: (data: {
    products: JewelryProduct[]
    categories: JewelryCategory[]
    saleItems: SaleFormItem[]
  }) => void
  barcodeEnabled?: boolean
}

function mapSaleToFormItems(sale: JewelrySale): SaleFormItem[] {
  return (sale.items ?? []).map((item) => {
    const quickType = GOLD_PURCHASE_QUICK_TYPES.find(
      (type) => type.defaultDescription === item.product_name,
    )

    return {
      key: String(item.id),
      item_description: item.product_name,
      karat: String(item.product?.karat ?? 22),
      weight_gram: String(item.weight_gram ?? item.product?.weight_gram ?? ''),
      unit_price: formatMoneyInputFromNumber(item.unit_price),
      quantity: String(item.quantity),
      product_id: item.product_id ? String(item.product_id) : '',
      category_id: item.product?.category_id ? String(item.product.category_id) : '',
      gold_type: quickType?.goldType ?? '',
      pricing_mode: quickType?.pricingMode ?? (
        Number(item.weight_gram) > 0 ? 'gram' : 'piece'
      ),
    }
  })
}

export default function JewelerSaleFormSection({
  scannerOpen: scannerOpenProp,
  onScannerOpenChange,
  barcodeSearchQuery = '',
  onBarcodeSearchQueryChange,
  externalBarcodeCode = null,
  onExternalBarcodeHandled,
  pendingProductId = null,
  onPendingProductHandled,
  editSaleId = null,
  onEditSaleHandled,
  onCatalogLoaded,
  barcodeEnabled = true,
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
  const [saleProduct, setSaleProduct] = useState<JewelryProduct | null>(null)
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null)
  const [editingSaleNumber, setEditingSaleNumber] = useState<string | null>(null)
  const [originalSaleStockBonus, setOriginalSaleStockBonus] = useState<Map<number, number>>(new Map())

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

  useEffect(() => {
    if (!loading && onCatalogLoaded) {
      onCatalogLoaded({ products, categories, saleItems: items })
    }
  }, [loading, products, categories, items, onCatalogLoaded])

  const saleSummary = useMemo(
    () => calculateSaleSummary(items, goldPrices),
    [items, goldPrices],
  )

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const resetForm = () => {
    setEditingSaleId(null)
    setEditingSaleNumber(null)
    setOriginalSaleStockBonus(new Map())
    setCustomerId('')
    setPaymentMethod('cash')
    setNotes('')
    setItems([])
  }

  const startEditSale = useCallback((sale: JewelrySale) => {
    const formItems = mapSaleToFormItems(sale)
    setEditingSaleId(sale.id)
    setEditingSaleNumber(sale.sale_number)
    setCustomerId(sale.customer_id ? String(sale.customer_id) : '')
    setPaymentMethod(sale.payment_method)
    setNotes(sale.notes ?? '')
    setItems(formItems)
    setOriginalSaleStockBonus(buildExtraStockFromSaleItems(formItems))
  }, [])

  useEffect(() => {
    if (!editSaleId || loading) {
      return
    }

    void getJewelrySale(editSaleId)
      .then((sale) => {
        startEditSale(sale)
        onEditSaleHandled?.()
      })
      .catch(() => {
        setError('Düzenlenecek satış kaydı yüklenemedi.')
        onEditSaleHandled?.()
      })
  }, [editSaleId, loading, startEditSale, onEditSaleHandled])

  const findCategoryId = (categoryName: string) => (
    categories.find((category) => category.name === categoryName)?.id
  )

  const saveItem = (item: SaleFormItem) => {
    let nextItem = { ...item }
    const quantity = Math.max(1, Number(nextItem.quantity) || 1)
    const otherItems = items.filter((row) => row.key !== item.key)

    if (item.gold_type) {
      const quickType = GOLD_PURCHASE_QUICK_TYPES.find(
        (type) => type.goldType === item.gold_type && type.defaultDescription === item.item_description,
      )

      if (quickType) {
        const maxQty = getSaleItemMaxQuantity(
          nextItem,
          products,
          categories,
          items,
          quickType,
          originalSaleStockBonus,
        )
        if (maxQty !== null && quantity > maxQty) {
          setError(`"${quickType.label}" için en fazla ${maxQty} adet eklenebilir.`)
          return
        }

        const product = pickProductForQuickGoldSale(quickType, products, categories, otherItems, quantity)

        if (!product) {
          setError(`"${quickType.label}" için stok yetersiz.`)
          return
        }

        nextItem = {
          ...nextItem,
          quantity: String(quantity),
          product_id: String(product.id),
          weight_gram: String(product.weight_gram),
        }
      }
    } else if (nextItem.product_id) {
      const product = productById.get(Number(nextItem.product_id))
      const maxQty = getSaleItemMaxQuantity(
        nextItem,
        products,
        categories,
        items,
        null,
        originalSaleStockBonus,
      )
      if (maxQty !== null && quantity > maxQty) {
        setError(`"${product?.name ?? nextItem.item_description}" için en fazla ${maxQty} adet eklenebilir.`)
        return
      }
      nextItem = { ...nextItem, quantity: String(quantity) }
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

  const openProductSaleModal = useCallback((product: JewelryProduct) => {
    const extra = originalSaleStockBonus.get(product.id) ?? 0
    const available = getAvailableProductStock(product, items, undefined, extra)
    if (available < 1) {
      setError(`"${product.name}" için yeterli stok yok.`)
      return
    }

    setError(null)
    setSaleProduct(product)
  }, [items, originalSaleStockBonus])

  const handleAddProductToForm = (payload: { quantity: number; unit_price: number }) => {
    if (!saleProduct) {
      return
    }

    const item = createSaleItemFromProduct(saleProduct)
    item.quantity = String(payload.quantity)
    item.unit_price = formatMoneyInputFromNumber(payload.unit_price)
    saveItem(item)
    setSaleProduct(null)
  }

  useEffect(() => {
    if (!pendingProductId || loading) {
      return
    }

    const product = products.find((row) => row.id === pendingProductId)
    if (product) {
      openProductSaleModal(product)
      onBarcodeSearchQueryChange?.('')
    }
    onPendingProductHandled?.()
  }, [pendingProductId, loading, products, openProductSaleModal, onPendingProductHandled, onBarcodeSearchQueryChange])

  const handleBarcodeScan = useCallback(async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) {
      return
    }

    setScannerOpen(false)
    setScanning(true)
    setError(null)

    try {
      const localProduct = products.find(
        (row) => row.barcode?.toLowerCase() === trimmed.toLowerCase()
          || row.sku?.toLowerCase() === trimmed.toLowerCase(),
      )
      const product = localProduct ?? await lookupBarcode(trimmed)
      openProductSaleModal(product)
      onBarcodeSearchQueryChange?.('')
    } catch {
      setError('Barkoda ait ürün bulunamadı.')
    } finally {
      setScanning(false)
    }
  }, [products, openProductSaleModal, onBarcodeSearchQueryChange, setScannerOpen])

  useEffect(() => {
    if (!barcodeEnabled || !externalBarcodeCode) {
      return
    }

    void handleBarcodeScan(externalBarcodeCode)
    onExternalBarcodeHandled?.()
  }, [barcodeEnabled, externalBarcodeCode, handleBarcodeScan, onExternalBarcodeHandled])

  const openQuickGoldModal = (quickType: GoldPurchaseQuickType) => {
    const available = getQuickGoldAvailableStock(
      quickType,
      products,
      categories,
      items,
      originalSaleStockBonus,
    )
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

          const stockBonus = originalSaleStockBonus.get(Number(item.product_id)) ?? 0

          if (reservedOthers + quantity > product.stock_quantity + stockBonus) {
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
      if (editingSaleId) {
        await updateJewelrySale(editingSaleId, payload)
        notifySaleCompleted('Satış güncellendi.')
      } else {
        await createJewelrySale(payload)
        notifySaleCompleted('Satış kaydedildi.')
      }
      resetForm()
      await load()
    } catch {
      setError(editingSaleId ? 'Satış kaydı güncellenemedi.' : 'Satış kaydı oluşturulamadı.')
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

  const editingItemMaxQuantity = useMemo(() => {
    if (!editingItem) {
      return null
    }

    return getSaleItemMaxQuantity(
      editingItem,
      products,
      categories,
      items,
      itemModalQuickType,
      originalSaleStockBonus,
    )
  }, [editingItem, products, categories, items, itemModalQuickType, originalSaleStockBonus])

  if (loading) {
    return (
      <>
        <LoadingState />
        {saleProduct && (
          <JewelryProductSaleModal
            product={saleProduct}
            goldPrices={goldPrices}
            variant="form"
            reservedQuantity={getReservedProductQuantity(items, saleProduct.id)}
          extraStock={originalSaleStockBonus.get(saleProduct.id) ?? 0}
            onAddToForm={handleAddProductToForm}
            onClose={() => setSaleProduct(null)}
          />
        )}
        {barcodeEnabled && scannerOpen && (
          <BarcodeScannerModal
            onScan={(code) => void handleBarcodeScan(code)}
            onClose={() => setScannerOpen(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="alert-error">{error}</p>}
      {scanning && (
        <p className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900">
          Barkod okunuyor...
        </p>
      )}

      <Card title={editingSaleId ? `Satış Düzenle #${editingSaleNumber ?? ''}` : 'Müşteriye Satış'}>
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="md:grid md:max-h-[calc(100dvh-12rem)] md:grid-cols-[minmax(0,1fr)_minmax(260px,34%)] md:overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="space-y-3 md:overflow-y-auto md:pr-3 lg:pr-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                label="Müşteri"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                options={customerOptions}
              />
              <JewelerPaymentMethodPicker
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={JEWELER_SALE_PAYMENT_OPTIONS}
                compact
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Hızlı Satış</p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {GOLD_PURCHASE_QUICK_TYPES.map((quickType) => {
                  const available = getQuickGoldAvailableStock(
                    quickType,
                    products,
                    categories,
                    items,
                    originalSaleStockBonus,
                  )

                  return (
                    <Button
                      key={quickType.key}
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={available < 1}
                      className="flex h-auto w-full flex-col gap-0.5 px-1 py-2 text-xs"
                      onClick={() => openQuickGoldModal(quickType)}
                    >
                      <span className="font-semibold">{quickType.label}</span>
                      <span className={`text-[10px] font-medium ${available > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {available > 0 ? `${available}` : 'Yok'}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <SaleStockProductPicker
                compact
                products={products}
                categories={categories}
                saleItems={items}
                extraStockByProductId={originalSaleStockBonus}
                externalSearchQuery={barcodeEnabled ? barcodeSearchQuery : ''}
                searchByBarcode={barcodeEnabled}
                onSelect={openProductSaleModal}
              />
            </div>
          </div>

          <div className="mt-3 flex min-h-0 flex-col border-t border-slate-100 pt-3 md:mt-0 md:border-l md:border-t-0 md:bg-slate-50/40 md:pl-3 md:pt-0 lg:pl-4">
            <div className="mb-2 shrink-0">
              <p className="text-sm font-semibold text-slate-800">
                Satılacak ({totalItemCount})
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-500">
                  Stoktan seçin{barcodeEnabled ? ', barkod okutun' : ''} veya hızlı satış kullanın.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((item) => {
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
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-sm font-semibold text-slate-900">{item.item_description}</p>
                              {linkedProduct && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                                  Stok
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {item.pricing_mode === 'gram'
                                ? `${item.weight_gram} gr · ${item.quantity} adet`
                                : `${item.quantity} adet`}
                              {item.karat ? ` · ${item.karat} ayar` : ''}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                              <span className="font-medium text-brand-700">
                                {formatJewelryMoney(total)}
                              </span>
                              {referenceValue > 0 && (
                                <span className={`font-semibold ${difference >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                  {difference >= 0 ? '+' : ''}{formatJewelryMoney(difference)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => openEditItemModal(item)}
                              className="text-[11px] font-semibold text-brand-700 hover:underline"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
                              className="text-[11px] font-semibold text-red-600 hover:underline"
                            >
                              Kaldır
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="mt-2 shrink-0 space-y-2 border-t border-slate-100 pt-2">
              <Textarea
                label="Not"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={1}
                className="min-h-[2.5rem] resize-none"
              />

              <div className="space-y-1 rounded-lg border border-brand-100 bg-brand-50/70 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-brand-900">Toplam tahsilat</span>
                  <span className="text-base font-bold text-brand-700">
                    {formatJewelryMoney(saleSummary.totalRevenue)}
                  </span>
                </div>
                {saleSummary.marketValue > 0 && (
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-brand-800">Piyasa farkı</span>
                    <span className={`font-bold ${saleSummary.difference >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {saleSummary.difference >= 0 ? '+' : ''}{formatJewelryMoney(saleSummary.difference)}
                    </span>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting || items.length === 0}>
                {submitting
                  ? 'Kaydediliyor...'
                  : editingSaleId
                    ? 'Satışı Güncelle'
                    : 'Satış Kaydet'}
              </Button>
              {editingSaleId && (
                <Button type="button" variant="secondary" className="w-full" onClick={resetForm}>
                  İptal
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {saleProduct && (
        <JewelryProductSaleModal
          product={saleProduct}
          goldPrices={goldPrices}
          variant="form"
          reservedQuantity={getReservedProductQuantity(items, saleProduct.id)}
          extraStock={originalSaleStockBonus.get(saleProduct.id) ?? 0}
          onAddToForm={handleAddProductToForm}
          onClose={() => setSaleProduct(null)}
        />
      )}

      {itemModalOpen && editingItem && (
        <JewelrySaleItemModal
          item={editingItem}
          quickType={itemModalQuickType}
          mode={itemModalMode}
          categories={categories}
          products={products}
          goldPrices={goldPrices}
          maxQuantity={editingItemMaxQuantity}
          onClose={() => {
            setItemModalOpen(false)
            setEditingItem(null)
          }}
          onSave={saveItem}
        />
      )}

      {barcodeEnabled && scannerOpen && (
        <BarcodeScannerModal
          onScan={(code) => void handleBarcodeScan(code)}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}
