import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../Button'
import Input from '../Input'
import Select from '../Select'
import {
  createJewelrySale,
  getMarketGoldPricesLatest,
  type MarketGoldPriceRecord,
} from '../../api/jeweler'
import { useJewelrySaleCart } from '../../context/JewelrySaleCartContext'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'
import {
  calculateJewelryCartTotals,
  calculateJewelrySaleProfit,
  formatJewelryMoney,
} from '../../utils/jewelryPrice'

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'card', label: 'Kart' },
  { value: 'transfer', label: 'Havale/EFT' },
  { value: 'gold_exchange', label: 'Altın Takas' },
]

export default function JewelrySaleCartCheckoutModal() {
  const {
    items,
    isCheckoutOpen,
    closeCheckout,
    updateItem,
    removeItem,
    clearCart,
    notifySaleCompleted,
  } = useJewelrySaleCart()

  useBodyScrollLock(isCheckoutOpen)

  const [goldPrices, setGoldPrices] = useState<MarketGoldPriceRecord[]>([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({})

  const discountValue = Number(discount) || 0

  const cartTotals = useMemo(
    () => calculateJewelryCartTotals(items, discountValue, goldPrices),
    [items, discountValue, goldPrices],
  )

  const loadGoldPrices = useCallback(async () => {
    try {
      const response = await getMarketGoldPricesLatest()
      setGoldPrices(response.prices)
    } catch {
      setGoldPrices([])
    }
  }, [])

  useEffect(() => {
    if (isCheckoutOpen) {
      void loadGoldPrices()
      setError(null)
      setLineErrors({})
    }
  }, [isCheckoutOpen, loadGoldPrices])

  if (!isCheckoutOpen) {
    return null
  }

  const handleLineQuantityChange = (lineId: string, value: string) => {
    const quantity = Number(value) || 1
    const lineError = updateItem(lineId, { quantity })
    setLineErrors((current) => {
      const next = { ...current }
      if (lineError) {
        next[lineId] = lineError
      } else {
        delete next[lineId]
      }
      return next
    })
  }

  const handleLinePriceChange = (lineId: string, value: string) => {
    const unitPrice = Number(value) || 0
    const lineError = updateItem(lineId, { unit_price: unitPrice })
    setLineErrors((current) => {
      const next = { ...current }
      if (lineError) {
        next[lineId] = lineError
      } else {
        delete next[lineId]
      }
      return next
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (items.length === 0) {
      setError('Sepet boş. Ürün ekleyerek devam edin.')
      return
    }

    if (Object.keys(lineErrors).length > 0) {
      setError('Sepetteki hatalı kalemleri düzeltin.')
      return
    }

    const invalidLine = items.find((item) => item.unit_price <= 0)
    if (invalidLine) {
      setError(`${invalidLine.product_name} için geçerli satış fiyatı girin.`)
      return
    }

    setSubmitting(true)

    try {
      await createJewelrySale({
        payment_method: paymentMethod,
        discount: discountValue,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          weight_gram: item.weight_gram,
          labor_cost: item.labor_cost,
          line_total: Math.round(item.unit_price * item.quantity * 100) / 100,
        })),
      })
      clearCart()
      closeCheckout()
      notifySaleCompleted()
    } catch {
      setError('Satış kaydedilemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  const profitPositive = cartTotals.totalProfit >= 0

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-0 lg:items-center lg:p-4"
      onClick={closeCheckout}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl lg:max-h-[88vh] lg:max-w-5xl lg:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-checkout-title"
      >
        <button
          type="button"
          onClick={closeCheckout}
          aria-label="Kapat"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900 lg:right-4 lg:top-4"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex min-h-0 flex-1 flex-col lg:max-h-[88vh]">
          <div className="shrink-0 border-b border-slate-100 p-4 sm:p-5 lg:px-6 lg:py-5">
            <h2 id="cart-checkout-title" className="pr-9 text-xl font-bold text-slate-900 lg:text-2xl">
              Satış Sepeti
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {items.length} kalem · {items.reduce((sum, item) => sum + item.quantity, 0)} ürün
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:px-6">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                  <p className="text-sm font-medium text-slate-700">Sepetiniz boş</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Ürün detayından veya satış ekranından kalem ekleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const lineProfit = calculateJewelrySaleProfit(
                      item.unit_price,
                      item.weight_gram,
                      item.karat,
                      item.labor_cost,
                      item.quantity,
                      0,
                      item.catalog_price,
                      goldPrices,
                    )
                    const previewUrl = resolveMenuAssetUrl(null, item.image_path)

                    return (
                      <li
                        key={item.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white sm:h-20 sm:w-20">
                            {previewUrl ? (
                              <img src={previewUrl} alt={item.product_name} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <span className="text-[10px] text-slate-400">Görsel yok</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{item.product_name}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {item.karat} ayar · {item.weight_gram} gr · Liste: {formatJewelryMoney(item.catalog_price)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                              >
                                Kaldır
                              </button>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <Input
                                label="Satış Fiyatı"
                                type="number"
                                min="0"
                                step="0.01"
                                value={String(item.unit_price)}
                                onChange={(e) => handleLinePriceChange(item.id, e.target.value)}
                              />
                              <Input
                                label="Adet"
                                type="number"
                                min="1"
                                max={item.stock_quantity}
                                value={String(item.quantity)}
                                onChange={(e) => handleLineQuantityChange(item.id, e.target.value)}
                              />
                              <div className="col-span-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs sm:col-span-2 lg:col-span-2">
                                <p className="text-slate-500">Satır toplamı</p>
                                <p className="font-semibold text-slate-900">{formatJewelryMoney(lineProfit.subtotal)}</p>
                                <p className={`mt-1 font-medium ${lineProfit.totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                  Kar: {formatJewelryMoney(lineProfit.totalProfit)}
                                </p>
                              </div>
                            </div>

                            {lineErrors[item.id] && (
                              <p className="mt-2 text-xs text-red-600">{lineErrors[item.id]}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}

              {items.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Select
                    label="Ödeme Yöntemi"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    options={PAYMENT_OPTIONS}
                  />
                  <Input
                    label="Ek İndirim (₺)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="shrink-0 border-t border-slate-100 bg-white p-4 sm:p-5 lg:px-6">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                    <p className="font-semibold text-slate-900">Satış özeti</p>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Ara toplam</span>
                        <span className="font-medium">{formatJewelryMoney(cartTotals.subtotal)}</span>
                      </div>
                      {cartTotals.discount > 0 && (
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500">İndirim</span>
                          <span className="font-medium text-red-600">-{formatJewelryMoney(cartTotals.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-3 border-t border-slate-200 pt-1.5">
                        <span className="font-semibold text-slate-900">Tahsil edilecek</span>
                        <span className="text-lg font-bold text-brand-700">
                          {formatJewelryMoney(cartTotals.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-4 text-sm ${profitPositive ? 'border-emerald-100 bg-emerald-50/80' : 'border-red-100 bg-red-50/80'}`}>
                    <p className="font-semibold text-slate-900">Toplam karlılık</p>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Toplam maliyet</span>
                        <span className="font-medium">{formatJewelryMoney(cartTotals.totalCost)}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-slate-200/80 pt-1.5">
                        <span className="font-semibold text-slate-900">Toplam kar</span>
                        <span className={`text-lg font-bold ${profitPositive ? 'text-emerald-700' : 'text-red-600'}`}>
                          {formatJewelryMoney(cartTotals.totalProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Kar marjı</span>
                        <span className={`font-semibold ${profitPositive ? 'text-emerald-700' : 'text-red-600'}`}>
                          %{cartTotals.profitMarginPercent.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Kaydediliyor...' : 'Satışı Tamamla'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeCheckout}>
                    Kapat
                  </Button>
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className="shrink-0 border-t border-slate-100 p-4 sm:p-5 lg:px-6">
                <Button type="button" variant="secondary" onClick={closeCheckout}>
                  Kapat
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
