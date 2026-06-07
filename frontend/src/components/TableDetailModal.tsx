import { useState } from 'react'
import type { Category, Product, RestaurantTable } from '../api/types'
import {
  TABLE_STATUS_STYLES,
  type TableStatus,
} from '../constants/tableStatuses'
import {
  formatOccupiedDuration,
  getActiveTableProducts,
  getTableItemCount,
  getTableTotalAmount,
  getTableWaiterName,
} from '../utils/tableHelpers'
import Button from './Button'
import Input from './Input'
import TableStatusPicker, { TableStatusBadge } from './TableStatusPicker'

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
  onPayBill: (tableId: number) => Promise<void>
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

  const total = getTableTotalAmount(table.products)
  const itemCount = getTableItemCount(table.products)
  const tableProducts = getActiveTableProducts(table.products)
  const duration = formatOccupiedDuration(table.occupied_at ?? null, now)
  const waiterName = getTableWaiterName(table)
  const activeProducts = products.filter((product) => product.is_active)
  const categoryProducts = selectedCategory
    ? activeProducts.filter((product) => product.category_id === selectedCategory.id)
    : []

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

  const handlePayBill = async () => {
    if (!window.confirm('Hesap ödendi olarak işaretlensin ve masa boşaltılsın mı?')) {
      return
    }

    setSubmitting(true)

    try {
      await onPayBill(table.id)
      onClose()
    } catch {
      window.alert('Hesap kapatılamadı.')
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
              <h3 className="text-lg font-bold text-gray-900">Hesap Detayı</h3>

              {tableProducts.length > 0 ? (
                <div className="space-y-3">
                  {tableProducts.map((product) => {
                    const quantity = product.pivot?.quantity ?? 1
                    const unitPrice = Number(product.price)
                    const lineTotal = unitPrice * quantity
                    const note = product.pivot?.note

                    return (
                      <div
                        key={`bill-${product.pivot?.id ?? product.id}`}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {product.name}
                              {quantity > 1 && (
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                  x{quantity}
                                </span>
                              )}
                            </p>
                            {note && (
                              <p className="mt-1 text-sm italic text-amber-700">{note}</p>
                            )}
                            {product.description && (
                              <p className="mt-1 text-sm text-gray-600">{product.description}</p>
                            )}
                            {product.category?.name && (
                              <p className="mt-1 text-xs text-gray-500">{product.category.name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{unitPrice.toFixed(2)} ₺</p>
                            <p className="font-bold text-blue-700">{lineTotal.toFixed(2)} ₺</p>
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

              <Button
                type="button"
                onClick={handlePayBill}
                disabled={submitting || itemCount === 0}
                className="w-full"
              >
                {submitting ? 'İşleniyor...' : 'Hesap Ödendi — Masayı Boşalt'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
