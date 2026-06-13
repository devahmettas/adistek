import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import JewelryPurchaseDetailModal from '../../components/jeweler/JewelryPurchaseDetailModal'
import JewelryPurchaseItemModal from '../../components/jeweler/JewelryPurchaseItemModal'
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
import { formatMoneyInputFromNumber, parseMoneyInput } from '../../utils/moneyInput'
import { formatPanelMoney, PanelStatCard } from '../../components/restaurant/ManagementPanelWidgets'

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

export default function JewelerPurchasesPage() {
  const [purchases, setPurchases] = useState<JewelryPurchase[]>([])
  const [customers, setCustomers] = useState<JewelryCustomer[]>([])
  const [products, setProducts] = useState<JewelryProduct[]>([])
  const [categories, setCategories] = useState<JewelryCategory[]>([])
  const [goldPrices, setGoldPrices] = useState<MarketGoldPriceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<JewelryPurchase | null>(null)
  const [customerId, setCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PurchaseFormItem[]>([])

  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [itemModalMode, setItemModalMode] = useState<'quick-gold' | 'custom'>('custom')
  const [itemModalQuickType, setItemModalQuickType] = useState<GoldPurchaseQuickType | null>(null)
  const [editingItem, setEditingItem] = useState<PurchaseFormItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [purchaseData, customerData, productData, categoryData, goldResponse] = await Promise.all([
        getJewelryPurchases(),
        getJewelryCustomers(),
        getJewelryProducts(),
        getJewelryCategories(),
        getMarketGoldPricesLatest(),
      ])
      setPurchases(purchaseData)
      setCustomers(customerData)
      setProducts(productData)
      setCategories(categoryData)
      setGoldPrices(goldResponse.prices)
    } catch {
      setError('Alım kayıtları yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const profitSummary = useMemo(
    () => calculatePurchaseProfitSummary(items, goldPrices),
    [items, goldPrices],
  )

  const summary = useMemo(() => {
    const totalPaid = purchases.reduce((sum, purchase) => sum + Number(purchase.total), 0)
    const itemCount = purchases.reduce(
      (sum, purchase) => sum + (purchase.items ?? []).reduce((lineSum, item) => lineSum + item.quantity, 0),
      0,
    )
    return {
      count: purchases.length,
      totalPaid,
      itemCount,
    }
  }, [purchases])

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
    setSelectedPurchase(null)
  }

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
    <div className="space-y-6">
      <PageHeader
        title="Ürün Al Yönetimi"
        description="Müşteriden altın alımını hızlıca kaydedin. Güncel ayar fiyatına göre uyguna alım analizi yapılır."
      />

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {!loading && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <PanelStatCard label="Toplam alım" value={String(summary.count)} hint="Kayıt sayısı" accent="brand" />
            <PanelStatCard label="Alınan kalem" value={String(summary.itemCount)} hint="Ürün adedi" accent="amber" />
            <PanelStatCard label="Ödenen tutar" value={formatPanelMoney(summary.totalPaid)} hint="Tüm alımlar" accent="emerald" />
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title={editingId ? 'Alım Düzenle' : 'Yeni Alım Kaydı'}>
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

            <Card title={`Alım Listesi (${purchases.length})`}>
              {purchases.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Henüz alım kaydı yok.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {purchases.map((purchase) => {
                    const itemLabels = (purchase.items ?? []).map((item) => item.item_description).join(' · ')

                    return (
                      <li key={purchase.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPurchase(purchase)}
                          className="flex w-full flex-col gap-2 py-4 text-left transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">#{purchase.purchase_number}</p>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                                {PAYMENT_OPTIONS.find((option) => option.value === purchase.payment_method)?.label
                                  ?? purchase.payment_method}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(purchase.purchased_at).toLocaleString('tr-TR')}
                              {purchase.customer ? ` · ${purchase.customer.name}` : ''}
                            </p>
                            <p className="mt-2 line-clamp-2 text-xs text-slate-600">{itemLabels}</p>
                          </div>
                          <div className="shrink-0 sm:text-right">
                            <p className="text-lg font-bold text-emerald-700">
                              {formatPanelMoney(Number(purchase.total))}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">Detay →</p>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      {itemModalOpen && editingItem && (
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

      {selectedPurchase && (
        <JewelryPurchaseDetailModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onEdit={() => startEdit(selectedPurchase)}
        />
      )}
    </div>
  )
}
