import { useMemo, useState } from 'react'
import type { Category, Product, RestaurantTable } from '../api/types'
import {
  TABLE_STATUS_STYLES,
  type TableStatus,
} from '../constants/tableStatuses'
import {
  buildPartialPayItems,
  getAllBillSelections,
  getSelectedBillCount,
  getSelectedBillTotal,
  groupBillProducts,
  type PartialPayItem,
} from '../utils/billHelpers'
import Button from './Button'
import Input from './Input'
import TableStatusPicker, { TableStatusBadge } from './TableStatusPicker'
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from '../constants/paymentMethods'
import {
  formatOccupiedDuration,
  getActiveTableProducts,
  getTableItemCount,
  getTableTotalAmount,
  getTableWaiterName,
} from '../utils/tableHelpers'

type ViewMode = 'main' | 'categories' | 'products' | 'bill'

interface TableDetailModalProps {
  table: RestaurantTable
  categories: Category[]
  products: Product[]
  now: number
  onClose: () => void
  onAddProduct: (
    tableId: number,
    productId: number,
    quantity?: number,
    note?: string,
  ) => Promise<void>
  onUpdateProduct: (
    tableId: number,
    pivotId: number,
    payload: { quantity: number; note?: string | null },
  ) => Promise<void>
  onCancelProduct: (tableId: number, pivotId: number) => Promise<void>
  onChangeStatus?: (tableId: number, status: TableStatus) => Promise<void>
  onRequestBill: (tableId: number) => Promise<void>
  onPayBill: (tableId: number, paymentMethod: PaymentMethod) => Promise<void>
  onPartialPayBill: (
    tableId: number,
    paymentMethod: PaymentMethod,
    items: PartialPayItem[],
  ) => Promise<{ table: RestaurantTable; message: string }>
}

export default function TableDetailModal({
  table,
  categories,
  products,
  now,
  onClose,
  onAddProduct,
  onUpdateProduct,
  onCancelProduct,
  onChangeStatus,
  onRequestBill,
  onPayBill,
  onPartialPayBill,
}: TableDetailModalProps) {
  const status = (table.status || 'empty') as TableStatus
  const styles = TABLE_STATUS_STYLES[status] ?? TABLE_STATUS_STYLES.empty
  const [view, setView] = useState<ViewMode>('main')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [addingProduct, setAddingProduct] = useState<Product | null>(null)
  const [addQuantity, setAddQuantity] = useState(1)
  const [addNote, setAddNote] = useState('')
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(DEFAULT_PAYMENT_METHOD)
  const [showPayConfirm, setShowPayConfirm] = useState(false)
  const [payMode, setPayMode] = useState<'full' | 'partial'>('full')
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({})

  const total = getTableTotalAmount(table.products)
  const itemCount = getTableItemCount(table.products)
  const tableProducts = getActiveTableProducts(table.products)
  const duration = formatOccupiedDuration(table.occupied_at ?? null, now)
  const waiterName = getTableWaiterName(table)
  const activeProducts = products.filter((product) => product.is_active)
  const categoryProducts = selectedCategory
    ? activeProducts.filter((product) => product.category_id === selectedCategory.id)
    : []

  const billGroups = useMemo(() => groupBillProducts(tableProducts), [tableProducts])

  const selectedTotal = useMemo(
    () => getSelectedBillTotal(billGroups, selectedQuantities),
    [billGroups, selectedQuantities],
  )

  const selectedCount = useMemo(
    () => getSelectedBillCount(selectedQuantities),
    [selectedQuantities],
  )

  const confirmTotal = payMode === 'full' ? total : selectedTotal

  const increaseGroupSelection = (groupKey: string, maxQuantity: number, step = 1) => {
    setSelectedQuantities((current) => {
      const next = Math.min(maxQuantity, (current[groupKey] ?? 0) + step)

      if (next <= 0) {
        const { [groupKey]: _, ...rest } = current
        return rest
      }

      return { ...current, [groupKey]: next }
    })
  }

  const decreaseGroupSelection = (groupKey: string) => {
    setSelectedQuantities((current) => {
      const next = (current[groupKey] ?? 0) - 1

      if (next <= 0) {
        const { [groupKey]: _, ...rest } = current
        return rest
      }

      return { ...current, [groupKey]: next }
    })
  }

  const selectAllBillItems = () => {
    setSelectedQuantities(getAllBillSelections(billGroups))
  }

  const clearBillSelection = () => {
    setSelectedQuantities({})
  }

  const resetAddForm = () => {
    setAddingProduct(null)
    setAddQuantity(1)
    setAddNote('')
  }

  const handleAddProduct = async () => {
    if (!addingProduct) {
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      await onAddProduct(table.id, addingProduct.id, addQuantity, addNote.trim() || undefined)
      setFeedback(`${addingProduct.name} eklendi`)
      resetAddForm()
    } catch {
      setFeedback('Ürün eklenemedi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuantityChange = async (product: Product, newQuantity: number) => {
    const pivotId = product.pivot?.id

    if (!pivotId) {
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      await onUpdateProduct(table.id, pivotId, {
        quantity: newQuantity,
        note: product.pivot?.note ?? null,
      })
    } catch {
      setFeedback('Adet güncellenemedi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleIncrement = async (product: Product) => {
    setSubmitting(true)
    setFeedback(null)

    try {
      await onAddProduct(
        table.id,
        product.id,
        1,
        product.pivot?.note?.trim() || undefined,
      )
    } catch {
      setFeedback('Ürün eklenemedi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelProduct = async (product: Product) => {
    const pivotId = product.pivot?.id

    if (!pivotId) {
      return
    }

    if (!window.confirm(`${product.name} siparişi iptal edilsin mi?`)) {
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      await onCancelProduct(table.id, pivotId)
      setFeedback(`${product.name} iptal edildi`)
    } catch {
      setFeedback('Sipariş iptal edilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestBill = async () => {
    setSubmitting(true)

    try {
      await onRequestBill(table.id)
      setView('bill')
    } catch {
      window.alert('Hesap açılamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayBill = () => {
    if (itemCount === 0) {
      return
    }

    setPayMode('full')
    setPaymentMethod(DEFAULT_PAYMENT_METHOD)
    setShowPayConfirm(true)
  }

  const handlePartialPay = () => {
    if (selectedCount === 0) {
      setFeedback('Ödenecek ürün seçin.')
      return
    }

    setPayMode('partial')
    setPaymentMethod(DEFAULT_PAYMENT_METHOD)
    setShowPayConfirm(true)
  }

  const confirmPayBill = async () => {
    setSubmitting(true)
    setFeedback(null)

    try {
      if (payMode === 'full') {
        await onPayBill(table.id, paymentMethod)
        setShowPayConfirm(false)
        onClose()
        return
      }

      const payItems = buildPartialPayItems(billGroups, selectedQuantities)
      const result = await onPartialPayBill(table.id, paymentMethod, payItems)
      setShowPayConfirm(false)
      setSelectedQuantities({})
      setFeedback(result.message)

      if (result.table.status === 'empty') {
        onClose()
      } else {
        setView('main')
      }
    } catch {
      setShowPayConfirm(false)
      setFeedback(payMode === 'full' ? 'Hesap kapatılamadı.' : 'Parça ödeme alınamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkDelivered = async () => {
    if (!onChangeStatus) {
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      await onChangeStatus(table.id, 'served')
      setFeedback('Masa teslim edildi olarak işaretlendi.')
    } catch {
      setFeedback('Durum güncellenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (nextStatus: TableStatus) => {
    if (!onChangeStatus) {
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      await onChangeStatus(table.id, nextStatus)
      setStatusMenuOpen(false)
    } catch {
      setFeedback('Durum güncellenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  const goBack = () => {
    if (view === 'products') {
      if (addingProduct) {
        resetAddForm()
        return
      }

      setView('categories')
      setSelectedCategory(null)
      setFeedback(null)
      return
    }

    setView('main')
    setSelectedCategory(null)
    resetAddForm()
    setFeedback(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`shrink-0 border-b px-5 py-4 ${styles.card}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              {view !== 'main' && (
                <button
                  type="button"
                  onClick={goBack}
                  className="mb-2 text-sm text-blue-700 hover:text-blue-800"
                >
                  ← Geri
                </button>
              )}
              <h2 className="text-xl font-bold text-gray-900">{table.name}</h2>
              {waiterName && (
                <p className="mt-1 text-sm font-medium text-indigo-700">
                  Sorumlu garson: {waiterName}
                </p>
              )}
              <div className="relative mt-2">
                <TableStatusBadge
                  status={status}
                  onClick={
                    onChangeStatus
                      ? (event) => {
                          event.stopPropagation()
                          setStatusMenuOpen((open) => !open)
                        }
                      : undefined
                  }
                />
                {statusMenuOpen && onChangeStatus && (
                  <TableStatusPicker
                    status={status}
                    onChange={handleStatusChange}
                    onClose={() => setStatusMenuOpen(false)}
                  />
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-white/60"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/70 px-3 py-2">
              <p className="text-xs text-gray-500">Toplam</p>
              <p className="text-lg font-bold text-blue-700">{total.toFixed(2)} ₺</p>
            </div>
            <div className="rounded-xl bg-white/70 px-3 py-2">
              <p className="text-xs text-gray-500">Ürün</p>
              <p className="text-lg font-bold text-gray-900">{itemCount} adet</p>
            </div>
            <div className="rounded-xl bg-white/70 px-3 py-2">
              <p className="text-xs text-gray-500">Süre</p>
              <p className="text-sm font-bold text-gray-900">{duration ?? 'Boş'}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {view === 'main' && (
            <div className="space-y-5">
              {feedback && (
                <p
                  className={`rounded-lg px-3 py-2 text-sm ${
                    feedback.includes('edilemedi') || feedback.includes('eklenemedi')
                      ? 'bg-red-50 text-red-700'
                      : 'bg-green-50 text-green-700'
                  }`}
                >
                  {feedback}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setView('categories')}
                  disabled={categories.length === 0}
                  className="h-24 text-base"
                >
                  + Ürün Ekle
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRequestBill}
                  disabled={submitting || itemCount === 0}
                  className="h-24 text-base"
                >
                  Hesap İste
                </Button>
              </div>

              {onChangeStatus && itemCount > 0 && status !== 'served' && status !== 'empty' && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleMarkDelivered}
                  disabled={submitting}
                  className="w-full border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100"
                >
                  Teslim Edildi
                </Button>
              )}

              {itemCount > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tableProducts.map((product) => {
                    const quantity = product.pivot?.quantity ?? 1
                    const lineTotal = Number(product.price) * quantity
                    const note = product.pivot?.note

                    return (
                      <div
                        key={product.pivot?.id ?? `${product.id}-${product.pivot?.created_at ?? ''}`}
                        className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            {product.pivot?.kitchen_status === 'ready' && (
                              <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                Mutfaktan hazır
                              </span>
                            )}
                            {note ? (
                              <p className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                                {note}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-gray-400">Standart</p>
                            )}
                            <p className="mt-2 font-bold text-blue-700">{lineTotal.toFixed(2)} ₺</p>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleCancelProduct(product)}
                              className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              İptal
                            </button>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              disabled={submitting || quantity <= 1}
                              onClick={() => handleQuantityChange(product, quantity - 1)}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              aria-label="Azalt"
                            >
                              −
                            </button>
                            <span className="min-w-[2rem] text-center font-semibold text-gray-900">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={submitting || quantity >= 99}
                              onClick={() => handleIncrement(product)}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-300 bg-blue-50 text-lg font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                              aria-label="Artır"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500">
                  Masada henüz ürün yok. Ürün eklemek için butona tıklayın.
                </p>
              )}
            </div>
          )}

          {view === 'categories' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Kategori Seçin</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500">Önce kategori ekleyin.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {categories.map((category) => {
                    const count = activeProducts.filter(
                      (product) => product.category_id === category.id,
                    ).length

                    return (
                      <button
                        key={category.id}
                        type="button"
                        disabled={count === 0}
                        onClick={() => {
                          setSelectedCategory(category)
                          setView('products')
                          resetAddForm()
                          setFeedback(null)
                        }}
                        className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-blue-100 bg-blue-50 p-4 text-center transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="text-base font-bold text-gray-900">{category.name}</span>
                        <span className="mt-2 text-xs text-gray-600">{count} ürün</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {view === 'products' && selectedCategory && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">{selectedCategory.name}</h3>

              {addingProduct ? (
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-semibold text-gray-900">{addingProduct.name}</p>
                  <p className="mt-1 text-sm text-blue-700">
                    {Number(addingProduct.price).toFixed(2)} ₺
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Adet</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={addQuantity <= 1}
                          onClick={() => setAddQuantity((value) => Math.max(1, value - 1))}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="min-w-[2.5rem] text-center text-xl font-bold text-gray-900">
                          {addQuantity}
                        </span>
                        <button
                          type="button"
                          disabled={addQuantity >= 99}
                          onClick={() => setAddQuantity((value) => Math.min(99, value + 1))}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-300 bg-blue-50 text-lg font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <Input
                      label="Not (opsiyonel)"
                      name="addNote"
                      value={addNote}
                      onChange={(event) => setAddNote(event.target.value)}
                      placeholder="Örn: badem sütlü, buzsuz — farklı not ayrı kalem olur"
                    />

                    {feedback && (
                      <p
                        className={`rounded-lg px-3 py-2 text-sm ${
                          feedback.includes('eklenemedi')
                            ? 'bg-red-50 text-red-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {feedback}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetAddForm}
                        disabled={submitting}
                        className="flex-1"
                      >
                        İptal
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddProduct}
                        disabled={submitting}
                        className="flex-1"
                      >
                        {submitting ? 'Ekleniyor...' : 'Masaya Ekle'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {feedback && (
                    <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                      {feedback}
                    </p>
                  )}
                  {categoryProducts.length === 0 ? (
                    <p className="text-sm text-gray-500">Bu kategoride aktif ürün yok.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {categoryProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            setAddingProduct(product)
                            setAddQuantity(1)
                            setAddNote('')
                            setFeedback(null)
                          }}
                          className="flex aspect-square flex-col justify-between rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          <span className="font-semibold text-gray-900">{product.name}</span>
                          <span className="text-lg font-bold text-blue-700">
                            {Number(product.price).toFixed(2)} ₺
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {view === 'bill' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hesap Detayı</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Ürüne dokunarak seçin, + / − ile adedi ayarlayın veya tüm hesabı kapatın.
                </p>
              </div>

              {billGroups.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <button
                      type="button"
                      onClick={selectAllBillItems}
                      className="font-medium text-blue-700 hover:text-blue-800"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={clearBillSelection}
                      className="font-medium text-gray-600 hover:text-gray-800"
                    >
                      Seçimi Temizle
                    </button>
                    {selectedCount > 0 && (
                      <span className="text-gray-500">
                        {selectedCount} adet seçili · {selectedTotal.toFixed(2)} ₺
                      </span>
                    )}
                  </div>

                  {billGroups.map((group) => {
                    const selectedQty = selectedQuantities[group.key] ?? 0
                    const isSelected = selectedQty > 0

                    return (
                      <div
                        key={group.key}
                        role="button"
                        tabIndex={0}
                        onClick={() => increaseGroupSelection(group.key, group.totalQuantity)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            increaseGroupSelection(group.key, group.totalQuantity)
                          }
                        }}
                        className={`rounded-xl border p-4 transition ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-50/70 ring-1 ring-indigo-200'
                            : 'border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900">
                              {group.name}
                              <span className="ml-2 text-sm font-bold text-indigo-700">
                                x{group.totalQuantity}
                              </span>
                            </p>
                            {group.note && (
                              <p className="mt-1 text-sm italic text-amber-700">{group.note}</p>
                            )}
                            {group.description && (
                              <p className="mt-1 text-sm text-gray-600">{group.description}</p>
                            )}
                            {group.categoryName && (
                              <p className="mt-1 text-xs text-gray-500">{group.categoryName}</p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">
                              Birim: {group.unitPrice.toFixed(2)} ₺
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <p className="font-bold text-blue-700">{group.lineTotal.toFixed(2)} ₺</p>

                            {isSelected ? (
                              <div
                                className="flex items-center gap-2"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => decreaseGroupSelection(group.key)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-gray-700 ring-1 ring-gray-200"
                                >
                                  −
                                </button>
                                <span className="min-w-[2rem] text-center text-sm font-bold text-indigo-800">
                                  {selectedQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    increaseGroupSelection(group.key, group.totalQuantity)
                                  }
                                  disabled={selectedQty >= group.totalQuantity}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white disabled:opacity-40"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-500 ring-1 ring-gray-200">
                                Seçmek için dokun
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                    <span className="font-semibold text-gray-900">Genel Toplam</span>
                    <span className="text-xl font-bold text-blue-700">{total.toFixed(2)} ₺</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Hesapta ürün bulunmuyor.</p>
              )}

              {feedback && view === 'bill' && (
                <p
                  className={`rounded-lg px-3 py-2 text-sm ${
                    feedback.includes('alınamadı') || feedback.includes('kapatılamadı')
                      ? 'bg-red-50 text-red-700'
                      : 'bg-green-50 text-green-700'
                  }`}
                >
                  {feedback}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePartialPay}
                  disabled={submitting || selectedCount === 0}
                  className="w-full"
                >
                  Seçilenleri Öde
                  {selectedCount > 0 && ` (${selectedTotal.toFixed(2)} ₺)`}
                </Button>
                <Button
                  type="button"
                  onClick={handlePayBill}
                  disabled={submitting || itemCount === 0}
                  className="w-full"
                >
                  Tüm Hesabı Kapat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPayConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            event.stopPropagation()
            if (!submitting) {
              setShowPayConfirm(false)
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900">
              {payMode === 'full' ? 'Tüm Hesabı Kapat' : 'Parça Ödeme'}
            </h3>
            <p className="mt-2 text-sm font-semibold text-blue-700">
              Tutar: {confirmTotal.toFixed(2)} ₺
            </p>

            <div className="mt-4">
              <p className="mb-3 text-sm font-semibold text-gray-800">Ödeme Yöntemi</p>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    disabled={submitting}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                      paymentMethod === method
                        ? method === 'card'
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {PAYMENT_METHOD_LABELS[method]}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              {payMode === 'full' ? (
                <>
                  Hesap{' '}
                  <span className="font-semibold text-gray-900">
                    {PAYMENT_METHOD_LABELS[paymentMethod]}
                  </span>{' '}
                  olarak ödendi sayılsın ve masa boşaltılsın mı?
                </>
              ) : (
                <>
                  Seçilen {selectedCount} adet{' '}
                  <span className="font-semibold text-gray-900">
                    {PAYMENT_METHOD_LABELS[paymentMethod]}
                  </span>{' '}
                  ile tahsil edilsin mi? Masa açık kalacak, kalan ürünler hesapta durmaya devam eder.
                </>
              )}
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPayConfirm(false)}
                disabled={submitting}
                className="flex-1"
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                onClick={confirmPayBill}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'İşleniyor...' : 'Onayla'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
