import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../Button'
import MoneyInput from '../MoneyInput'
import Select from '../Select'
import { JewelryCartProfitBreakdown } from './JewelrySaleProfitBreakdown'
import {
  createJewelrySale,
  getJewelrySettings,
  getMarketGoldPricesLatest,
  type JewelrySettings,
  type MarketGoldPriceRecord,
} from '../../api/jeweler'
import { useJewelrySaleCart } from '../../context/JewelrySaleCartContext'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'
import {
  calculateJewelryCartTotals,
  calculateJewelrySaleProfit,
  formatJewelryMoney,
  type JewelrySaleFinancialSettings,
} from '../../utils/jewelryPrice'
import {
  formatMoneyInputFromNumber,
  formatMoneyInputWhileTyping,
  parseMoneyInput,
} from '../../utils/moneyInput'

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
    paymentMethod,
    setPaymentMethod,
  } = useJewelrySaleCart()

  useBodyScrollLock(isCheckoutOpen)

  const [goldPrices, setGoldPrices] = useState<MarketGoldPriceRecord[]>([])
  const [jewelrySettings, setJewelrySettings] = useState<JewelrySettings | null>(null)
  const [discount, setDiscount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({})
  const [linePriceInputs, setLinePriceInputs] = useState<Record<string, string>>({})

  const discountValue = parseMoneyInput(discount) || 0

  const financialSettings = useMemo<JewelrySaleFinancialSettings | undefined>(() => {
    if (!jewelrySettings) return undefined
    return {
      card_commission_rate: Number(jewelrySettings.card_commission_rate) || 0,
      tax_rate: Number(jewelrySettings.tax_rate) || 0,
    }
  }, [jewelrySettings])

  const cartTotals = useMemo(
    () => calculateJewelryCartTotals(
      items,
      discountValue,
      goldPrices,
      paymentMethod,
      financialSettings,
    ),
    [items, discountValue, goldPrices, paymentMethod, financialSettings],
  )

  const loadData = useCallback(async () => {
    try {
      const [goldResponse, settings] = await Promise.all([
        getMarketGoldPricesLatest(),
        getJewelrySettings(),
      ])
      setGoldPrices(goldResponse.prices)
      setJewelrySettings(settings)
    } catch {
      setGoldPrices([])
      setJewelrySettings(null)
    }
  }, [])

  useEffect(() => {
    if (isCheckoutOpen) {
      void loadData()
      setError(null)
      setLineErrors({})
      setLinePriceInputs({})
    }
  }, [isCheckoutOpen, loadData])

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
    const formatted = formatMoneyInputWhileTyping(value)
    setLinePriceInputs((current) => ({ ...current, [lineId]: formatted }))

    const unitPrice = parseMoneyInput(formatted)
    if (Number.isNaN(unitPrice)) {
      return
    }

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
          <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-5 lg:px-6">
            <h2 id="cart-checkout-title" className="pr-9 text-lg font-bold text-slate-900">
              Satış Sepeti
            </h2>
            <p className="text-xs text-slate-500">
              {items.length} kalem · {items.reduce((sum, item) => sum + item.quantity, 0)} ürün
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 sm:px-5 lg:px-6 lg:py-3">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                  <p className="text-sm font-medium text-slate-700">Sepetiniz boş</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ürün detayından veya satış ekranından kalem ekleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <div className="hidden border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[minmax(0,1fr)_88px_64px_108px_40px] sm:gap-2">
                    <span>Ürün</span>
                    <span className="text-center">Fiyat</span>
                    <span className="text-center">Adet</span>
                    <span className="text-right">Toplam / Kar</span>
                    <span />
                  </div>

                  <ul className="divide-y divide-slate-100">
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
                        <li key={item.id} className="bg-white px-3 py-2">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_88px_64px_108px_40px] sm:items-center sm:gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                                {previewUrl ? (
                                  <img
                                    src={previewUrl}
                                    alt={item.product_name}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                ) : (
                                  <span className="text-[9px] text-slate-400">—</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">{item.product_name}</p>
                                <p className="truncate text-[11px] text-slate-500">
                                  {item.karat} ayar · {item.weight_gram} gr
                                </p>
                              </div>
                            </div>

                            <label className="sm:contents">
                              <span className="mb-1 block text-[11px] text-slate-500 sm:hidden">Fiyat</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                value={linePriceInputs[item.id] ?? formatMoneyInputFromNumber(item.unit_price)}
                                onChange={(e) => handleLinePriceChange(item.id, e.target.value)}
                                className="input-field h-8 w-full px-2 py-1 text-xs sm:text-center"
                              />
                            </label>

                            <label className="sm:contents">
                              <span className="mb-1 block text-[11px] text-slate-500 sm:hidden">Adet</span>
                              <input
                                type="number"
                                min="1"
                                max={item.stock_quantity}
                                value={String(item.quantity)}
                                onChange={(e) => handleLineQuantityChange(item.id, e.target.value)}
                                className="input-field h-8 w-full px-2 py-1 text-xs sm:text-center"
                              />
                            </label>

                            <div className="flex items-center justify-between gap-2 sm:block sm:text-right">
                              <span className="text-[11px] text-slate-500 sm:hidden">Toplam / Kar</span>
                              <div>
                                <p className="text-xs font-semibold text-slate-900">
                                  {formatJewelryMoney(lineProfit.subtotal)}
                                </p>
                                <p className={`text-[11px] font-medium ${lineProfit.totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                  {formatJewelryMoney(lineProfit.totalProfit)}
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-end sm:justify-center">
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                aria-label={`${item.product_name} kaldır`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {lineErrors[item.id] && (
                            <p className="mt-1 text-[11px] text-red-600">{lineErrors[item.id]}</p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-5 lg:px-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Select
                    label="Ödeme Yöntemi"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    options={PAYMENT_OPTIONS}
                  />
                  <MoneyInput
                    label="Ek İndirim (₺)"
                    value={discount}
                    onValueChange={setDiscount}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Ara toplam</span>
                      <span className="font-medium">{formatJewelryMoney(cartTotals.subtotal)}</span>
                    </div>
                    {cartTotals.discount > 0 && (
                      <div className="mt-1 flex justify-between gap-2">
                        <span className="text-slate-500">İndirim</span>
                        <span className="font-medium text-red-600">-{formatJewelryMoney(cartTotals.discount)}</span>
                      </div>
                    )}
                    <div className="mt-1 flex justify-between gap-2 border-t border-slate-200 pt-1.5">
                      <span className="font-semibold text-slate-900">Tahsil</span>
                      <span className="font-bold text-brand-700">{formatJewelryMoney(cartTotals.totalRevenue)}</span>
                    </div>
                  </div>

                  <div className={`rounded-xl border px-3 py-2.5 ${profitPositive ? 'border-emerald-100 bg-emerald-50/80' : 'border-red-100 bg-red-50/80'}`}>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Maliyet</span>
                      <span className="font-medium">{formatJewelryMoney(cartTotals.totalCost)}</span>
                    </div>
                    <div className="mt-2 border-t border-slate-200/80 pt-2">
                      <JewelryCartProfitBreakdown totals={cartTotals} paymentMethod={paymentMethod} />
                    </div>
                  </div>
                </div>

                {error && <p className="mt-2 text-xs text-red-600 sm:text-sm">{error}</p>}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="submit" disabled={submitting} size="sm">
                    {submitting ? 'Kaydediliyor...' : 'Satışı Tamamla'}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={closeCheckout}>
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
