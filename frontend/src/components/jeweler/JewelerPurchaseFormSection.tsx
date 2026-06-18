import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../Button'
import Card from '../Card'
import JewelerPaymentMethodPicker from './JewelerPaymentMethodPicker'
import JewelryPurchaseItemModal from './JewelryPurchaseItemModal'
import LoadingState from '../LoadingState'
import Select from '../Select'
import StaffActionToasts, { useStaffToasts } from '../StaffActionToasts'
import Textarea from '../Textarea'
import {
  createJewelryPurchase,
  getJewelryCategories,
  getJewelryCustomers,
  getJewelryProducts,
  getJewelryPurchase,
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
  getPurchaseApiUnitPrice,
  getPurchaseGramWeight,
  GOLD_PURCHASE_QUICK_TYPES,
  type GoldPurchaseQuickType,
  type PurchaseFormItem,
} from '../../utils/jewelryPurchaseGold'
import { formatMoneyInputFromNumber } from '../../utils/moneyInput'

interface JewelerPurchaseFormSectionProps {
  editPurchaseId?: number | null
  onEditPurchaseHandled?: () => void
}

function mapPurchaseToFormItems(purchase: JewelryPurchase): PurchaseFormItem[] {
  return (purchase.items ?? []).map((item) => {
    const quickType = GOLD_PURCHASE_QUICK_TYPES.find(
      (type) => type.defaultDescription === item.item_description,
    )
    const pricingMode = quickType?.pricingMode ?? (
      Number(item.weight_gram) > 0 ? 'gram' : 'piece'
    )

    return {
      key: String(item.id),
      item_description: item.item_description,
      karat: String(item.karat ?? 22),
      weight_gram: String(item.weight_gram),
      unit_price: formatMoneyInputFromNumber(
        pricingMode === 'gram' ? item.line_total : item.unit_price,
      ),
      quantity: String(item.quantity),
      product_id: item.product_id ? String(item.product_id) : '',
      category_id: '',
      gold_type: quickType?.goldType ?? '',
      pricing_mode: pricingMode,
    }
  })
}

export default function JewelerPurchaseFormSection({
  editPurchaseId = null,
  onEditPurchaseHandled,
}: JewelerPurchaseFormSectionProps) {
  const { toasts, pushToast, dismissToast } = useStaffToasts()

  const [customers, setCustomers] = useState<JewelryCustomer[]>([])
  const [products, setProducts] = useState<JewelryProduct[]>([])
  const [categories, setCategories] = useState<JewelryCategory[]>([])
  const [goldPrices, setGoldPrices] = useState<MarketGoldPriceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingPurchaseNumber, setEditingPurchaseNumber] = useState<string | null>(null)
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
      setError('Alım verileri yüklenemedi.')
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

  const resetForm = () => {
    setEditingId(null)
    setEditingPurchaseNumber(null)
    setCustomerId('')
    setPaymentMethod('cash')
    setNotes('')
    setItems([])
  }

  const startEdit = useCallback((purchase: JewelryPurchase) => {
    setEditingId(purchase.id)
    setEditingPurchaseNumber(purchase.purchase_number)
    setCustomerId(purchase.customer_id ? String(purchase.customer_id) : '')
    setPaymentMethod(purchase.payment_method)
    setNotes(purchase.notes ?? '')
    setItems(mapPurchaseToFormItems(purchase))
  }, [])

  useEffect(() => {
    if (!editPurchaseId || loading) {
      return
    }

    void getJewelryPurchase(editPurchaseId)
      .then((purchase) => {
        startEdit(purchase)
        onEditPurchaseHandled?.()
      })
      .catch(() => {
        setError('Düzenlenecek alım kaydı yüklenemedi.')
        onEditPurchaseHandled?.()
      })
  }, [editPurchaseId, loading, startEdit, onEditPurchaseHandled])

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
    setError(null)
    setItems((current) => {
      const exists = current.some((row) => row.key === item.key)
      if (exists) {
        return current.map((row) => (row.key === item.key ? item : row))
      }
      return [...current, item]
    })
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
        weight_gram: getPurchaseGramWeight(item),
        unit_price: getPurchaseApiUnitPrice(item),
        quantity: Math.max(1, Number(item.quantity) || 1),
        line_total: calculatePurchaseLinePaid(item),
      })),
    }

    try {
      if (editingId) {
        await updateJewelryPurchase(editingId, payload)
        pushToast('success', 'Alım güncellendi.')
      } else {
        await createJewelryPurchase(payload)
        pushToast('success', 'Alım kaydedildi.')
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

  const totalItemCount = items.reduce(
    (sum, item) => sum + Math.max(1, Number(item.quantity) || 1),
    0,
  )

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-3">
      {error && <p className="alert-error">{error}</p>}

      <Card title={editingId ? `Alım Düzenle #${editingPurchaseNumber ?? ''}` : 'Müşteriden Alım'}>
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
                compact
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Hızlı Alım</p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {GOLD_PURCHASE_QUICK_TYPES.map((quickType) => (
                  <Button
                    key={quickType.key}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex h-auto w-full flex-col gap-0.5 px-1 py-2 text-xs"
                    onClick={() => openQuickGoldModal(quickType)}
                  >
                    <span className="font-semibold">{quickType.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex min-h-0 flex-col border-t border-slate-100 pt-3 md:mt-0 md:border-l md:border-t-0 md:bg-slate-50/40 md:pl-3 md:pt-0 lg:pl-4">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">
                Alınacak ({totalItemCount})
              </p>
              <Button type="button" size="sm" onClick={() => openCustomItemModal()}>
                Kalem Ekle
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-500">
                  Hızlı alım veya kalem ekle ile ürün ekleyin.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((item) => {
                    const paid = calculatePurchaseLinePaid(item)
                    const market = calculatePurchaseLineMarketValue(item, goldPrices)
                    const savings = Math.round((market - paid) * 100) / 100

                    return (
                      <li
                        key={item.key}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.item_description}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {Number(item.weight_gram) > 0
                                ? `${item.weight_gram} gr · ${item.quantity} adet`
                                : `${item.quantity} adet`}
                              {item.karat ? ` · ${item.karat} ayar` : ''}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                              <span className="font-medium text-emerald-700">
                                {formatJewelryMoney(paid)}
                              </span>
                              {market > 0 && (
                                <span className={`font-semibold ${savings >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
                                  {savings >= 0 ? 'Uyguna' : 'Pahalı'}: {savings >= 0 ? '+' : ''}{formatJewelryMoney(savings)}
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

              <div className="space-y-1 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-emerald-900">Toplam ödeme</span>
                  <span className="text-base font-bold text-emerald-700">
                    {formatJewelryMoney(profitSummary.totalPaid)}
                  </span>
                </div>
                {profitSummary.marketValue > 0 && (
                  <>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-emerald-800">Piyasa değeri</span>
                      <span className="font-semibold text-slate-900">
                        {formatJewelryMoney(profitSummary.marketValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-emerald-100 pt-1 text-[11px]">
                      <span className="font-medium text-emerald-900">
                        {profitSummary.savings >= 0 ? 'Uyguna alım' : 'Piyasanın üzerinde'}
                      </span>
                      <span className={`font-bold ${profitSummary.savings >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
                        {profitSummary.savings >= 0 ? '+' : ''}{formatJewelryMoney(profitSummary.savings)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting || items.length === 0}>
                {submitting
                  ? 'Kaydediliyor...'
                  : editingId
                    ? 'Alımı Güncelle'
                    : 'Alım Kaydet'}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" className="w-full" onClick={resetForm}>
                  İptal
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

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

      <StaffActionToasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
