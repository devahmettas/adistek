import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/Button'
import Card from '../../components/Card'
import JewelerSaleFormSection from '../../components/jeweler/JewelerSaleFormSection'
import JewelryPurchaseItemModal from '../../components/jeweler/JewelryPurchaseItemModal'
import PurchaseSaleModeToggle, { type PurchaseSaleMode } from '../../components/jeweler/PurchaseSaleModeToggle'
import SaleBarcodeScanButton from '../../components/jeweler/SaleBarcodeScanButton'
import SaleBarcodeSearch from '../../components/jeweler/SaleBarcodeSearch'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import Select from '../../components/Select'
import Textarea from '../../components/Textarea'
import {
  createJewelryPurchase,
  getJewelryCategories,
  getJewelryCustomers,
  getJewelryProducts,
  getJewelryPurchases,
  getMarketGoldPricesLatest,
  updateJewelryPurchase,
  type JewelryCategory,
  type JewelryCustomer,
  type JewelryProduct,
  type JewelryPurchase,
  type MarketGoldPriceRecord,
} from '../../api/jeweler'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import {
  calculatePurchaseLineMarketValue,
  calculatePurchaseLinePaid,
  calculatePurchaseProfitSummary,
  createEmptyPurchaseItem,
  createQuickGoldItem,
  GOLD_PURCHASE_QUICK_TYPES,
  type GoldPurchaseQuickType,
  type PurchaseFormItem,
} from '../../utils/jewelryPurchaseGold'
import type { SaleFormItem } from '../../utils/jewelrySaleGold'
import { formatMoneyInputFromNumber, parseMoneyInput } from '../../utils/moneyInput'

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'transfer', label: 'Havale/EFT' },
  { value: 'card', label: 'Kart' },
]

function mapPurchaseToFormItems(purchase: JewelryPurchase): PurchaseFormItem[] {
  return (purchase.items ?? []).map((item) => {
    const quickType = GOLD_PURCHASE_QUICK_TYPES.find(
      (type) => type.defaultDescription === item.item_description,
    )

    return {
      key: String(item.id),
      item_description: item.item_description,
      karat: String(item.karat ?? 22),
      weight_gram: String(item.weight_gram),
      unit_price: formatMoneyInputFromNumber(item.unit_price),
      quantity: String(item.quantity),
      product_id: item.product_id ? String(item.product_id) : '',
      category_id: '',
      gold_type: quickType?.goldType ?? '',
      pricing_mode: quickType?.pricingMode ?? (
        Number(item.weight_gram) > 0 ? 'gram' : 'piece'
      ),
    }
  })
}

function parseMode(value: string | null): PurchaseSaleMode {
  return value === 'sale' ? 'sale' : 'purchase'
}

export default function JewelerPurchasesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = parseMode(searchParams.get('mode'))

  const setMode = (nextMode: PurchaseSaleMode) => {
    if (nextMode === 'purchase') {
      setSearchParams({}, { replace: true })
      setSaleScannerOpen(false)
      return
    }
    setSearchParams({ mode: 'sale' }, { replace: true })
  }

  const [customers, setCustomers] = useState<JewelryCustomer[]>([])
  const [products, setProducts] = useState<JewelryProduct[]>([])
  const [categories, setCategories] = useState<JewelryCategory[]>([])
  const [goldPrices, setGoldPrices] = useState<MarketGoldPriceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [customerId, setCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PurchaseFormItem[]>([])

  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [itemModalMode, setItemModalMode] = useState<'quick-gold' | 'custom'>('custom')
  const [itemModalQuickType, setItemModalQuickType] = useState<GoldPurchaseQuickType | null>(null)
  const [editingItem, setEditingItem] = useState<PurchaseFormItem | null>(null)
  const [saleScannerOpen, setSaleScannerOpen] = useState(false)
  const [saleBarcodeQuery, setSaleBarcodeQuery] = useState('')
  const [externalBarcodeCode, setExternalBarcodeCode] = useState<string | null>(null)
  const [saleCatalog, setSaleCatalog] = useState<{
    products: JewelryProduct[]
    categories: JewelryCategory[]
    saleItems: SaleFormItem[]
  } | null>(null)
  const [pendingSaleProductId, setPendingSaleProductId] = useState<number | null>(null)

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
      setError('Veriler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mode === 'purchase') {
      void load()
    }
  }, [load, mode])

  const profitSummary = useMemo(
    () => calculatePurchaseProfitSummary(items, goldPrices),
    [items, goldPrices],
  )

  const resetForm = () => {
    setEditingId(null)
    setCustomerId('')
    setPaymentMethod('cash')
    setNotes('')
    setItems([])
  }

  const findCategoryId = (categoryName: string) => (
    categories.find((category) => category.name === categoryName)?.id
  )

  const openQuickGoldModal = (quickType: GoldPurchaseQuickType) => {
    const categoryId = findCategoryId(quickType.categoryName)
    setEditingItem(createQuickGoldItem(
      quickType,
      categoryId ? String(categoryId) : '',
    ))
    setItemModalMode('quick-gold')
    setItemModalQuickType(quickType)
    setItemModalOpen(true)
  }

  const openEditItemModal = (item: PurchaseFormItem) => {
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

  const saveItem = (item: PurchaseFormItem) => {
    setItems((current) => {
      const exists = current.some((row) => row.key === item.key)
      if (exists) {
        return current.map((row) => (row.key === item.key ? item : row))
      }
      return [...current, item]
    })
  }

  const startEdit = (purchase: JewelryPurchase) => {
    setEditingId(purchase.id)
    setCustomerId(purchase.customer_id ? String(purchase.customer_id) : '')
    setPaymentMethod(purchase.payment_method)
    setNotes(purchase.notes ?? '')
    setItems(mapPurchaseToFormItems(purchase))
  }

  const editParam = searchParams.get('edit')

  useEffect(() => {
    if (mode !== 'purchase' || !editParam) {
      return
    }

    void getJewelryPurchases()
      .then((data) => {
        const purchase = data.find((row) => row.id === Number(editParam))
        if (purchase) {
          startEdit(purchase)
        }
        setSearchParams((current) => {
          const next = new URLSearchParams(current)
          next.delete('edit')
          return next
        }, { replace: true })
      })
      .catch(() => {
        setError('Düzenlenecek alım kaydı yüklenemedi.')
      })
  }, [editParam, mode, setSearchParams])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const validItems = items.filter((item) => item.item_description.trim())
    if (validItems.length === 0) {
      setError('En az bir kalem ekleyin.')
      return
    }

    for (const item of validItems) {
      if (calculatePurchaseLinePaid(item) <= 0) {
        setError(`"${item.item_description}" için geçerli tutar girin.`)
        return
      }
    }

    setSubmitting(true)

    const payload = {
      customer_id: customerId ? Number(customerId) : null,
      payment_method: paymentMethod,
      notes: notes.trim() || undefined,
      items: validItems.map((item) => ({
        product_id: item.product_id ? Number(item.product_id) : null,
        category_id: item.category_id ? Number(item.category_id) : null,
        item_description: item.item_description.trim(),
        metal_type: 'gold',
        karat: Number(item.karat) || null,
        weight_gram: item.pricing_mode === 'gram' ? Number(item.weight_gram) || 0 : 0,
        unit_price: parseMoneyInput(item.unit_price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        line_total: calculatePurchaseLinePaid(item),
      })),
    }

    try {
      if (editingId) {
        await updateJewelryPurchase(editingId, payload)
      } else {
        await createJewelryPurchase(payload)
      }
      resetForm()
      await load()
    } catch {
      setError(editingId ? 'Alım kaydı güncellenemedi.' : 'Alım kaydı oluşturulamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  const customerOptions = [
    { value: '', label: 'Müşteri seçin (opsiyonel)' },
    ...customers.map((customer) => ({ value: String(customer.id), label: customer.name })),
  ]

  return (
    <div className={mode === 'sale' ? 'space-y-3' : 'space-y-6'}>
      <PageHeader
        title="Ürün Alış Satış"
        description={
          mode === 'purchase'
            ? 'Müşteriden altın alımını hızlıca kaydedin. Güncel ayar fiyatına göre uyguna alım analizi yapılır.'
            : undefined
        }
        actions={(
          <Link
            to={mode === 'sale' ? '/dashboard/jeweler/history' : '/dashboard/jeweler/history?tab=purchases'}
            className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-800"
          >
            İşlem Geçmişi
          </Link>
        )}
      />

      <div className={mode === 'sale' ? 'space-y-2' : 'space-y-3'}>
        <div className={`flex flex-col gap-2 ${mode === 'sale' ? 'xl:flex-row xl:items-center xl:gap-4' : 'md:flex-row md:items-center md:gap-6'}`}>
          <PurchaseSaleModeToggle mode={mode} onChange={setMode} />
          {mode === 'sale' && (
            <>
              <div className="flex justify-center xl:shrink-0 xl:justify-start">
                <SaleBarcodeScanButton onClick={() => setSaleScannerOpen(true)} />
              </div>
              {saleCatalog && (
                <div className="min-w-0 flex-1">
                  <SaleBarcodeSearch
                    products={saleCatalog.products}
                    categories={saleCatalog.categories}
                    saleItems={saleCatalog.saleItems}
                    value={saleBarcodeQuery}
                    onChange={setSaleBarcodeQuery}
                    onSelect={(product) => setPendingSaleProductId(product.id)}
                    onBarcodeSubmit={(code) => {
                      setExternalBarcodeCode(code)
                      setSaleBarcodeQuery('')
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {mode === 'sale' ? (
        <JewelerSaleFormSection
          scannerOpen={saleScannerOpen}
          onScannerOpenChange={setSaleScannerOpen}
          barcodeSearchQuery={saleBarcodeQuery}
          onBarcodeSearchQueryChange={setSaleBarcodeQuery}
          externalBarcodeCode={externalBarcodeCode}
          onExternalBarcodeHandled={() => setExternalBarcodeCode(null)}
          pendingProductId={pendingSaleProductId}
          onPendingProductHandled={() => setPendingSaleProductId(null)}
          onCatalogLoaded={setSaleCatalog}
        />
      ) : (
        <>
      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {!loading && (
        <>
          <Card title={editingId ? 'Alım Düzenle' : 'Müşteriden Alım'}>
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
                  <p className="text-sm font-semibold text-slate-800">Altın Ekle</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {GOLD_PURCHASE_QUICK_TYPES.map((quickType) => (
                      <Button
                        key={quickType.key}
                        type="button"
                        variant="secondary"
                        className="w-full py-3"
                        onClick={() => openQuickGoldModal(quickType)}
                      >
                        {quickType.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <p className="text-sm font-semibold text-slate-800">Alınan kalemler ({items.length})</p>
                  <Button type="button" size="sm" onClick={() => openCustomItemModal()}>
                    Kalem Ekle
                  </Button>
                </div>

                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500">
                    Henüz kalem yok. Altın Ekle veya Kalem Ekle ile ürün ekleyin.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item, index) => {
                      const paid = calculatePurchaseLinePaid(item)
                      const market = calculatePurchaseLineMarketValue(item, goldPrices)
                      const savings = Math.round((market - paid) * 100) / 100

                      return (
                        <li
                          key={item.key}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900">{item.item_description}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.pricing_mode === 'gram'
                                  ? `${item.weight_gram} gr · ${item.quantity} adet`
                                  : `${item.quantity} adet`}
                                {item.karat ? ` · ${item.karat} ayar` : ''}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                                <span className="font-medium text-emerald-700">
                                  Ödeme: {formatJewelryMoney(paid)}
                                </span>
                                {market > 0 && (
                                  <>
                                    <span className="text-slate-500">
                                      Piyasa: {formatJewelryMoney(market)}
                                    </span>
                                    <span className={`font-semibold ${savings >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
                                      {savings >= 0 ? 'Uyguna' : 'Pahalı'}: {savings >= 0 ? '+' : ''}{formatJewelryMoney(savings)}
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

                <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-emerald-900">Toplam ödeme</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {formatJewelryMoney(profitSummary.totalPaid)}
                    </span>
                  </div>
                  {profitSummary.marketValue > 0 && (
                    <>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-emerald-800">Güncel ayar piyasa değeri</span>
                        <span className="font-semibold text-slate-900">
                          {formatJewelryMoney(profitSummary.marketValue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-emerald-100 pt-2 text-sm">
                        <span className="font-medium text-emerald-900">
                          {profitSummary.savings >= 0 ? 'Uyguna alım / Kâr potansiyeli' : 'Piyasanın üzerinde ödeme'}
                        </span>
                        <span className={`font-bold ${profitSummary.savings >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
                          {profitSummary.savings >= 0 ? '+' : ''}{formatJewelryMoney(profitSummary.savings)}
                          {profitSummary.savings >= 0 && profitSummary.savingsPercent > 0 && (
                            <span className="ml-1 text-xs font-semibold">
                              (%{profitSummary.savingsPercent.toFixed(1)} uyguna)
                            </span>
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={submitting || items.length === 0}>
                    {submitting
                      ? 'Kaydediliyor...'
                      : editingId
                        ? 'Alımı Güncelle'
                        : 'Alım Kaydet'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="secondary" onClick={resetForm}>
                      İptal
                    </Button>
                  )}
                </div>
              </form>
            </Card>
        </>
      )}
        </>
      )}

      {mode === 'purchase' && itemModalOpen && editingItem && (
        <JewelryPurchaseItemModal
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
    </div>
  )
}
