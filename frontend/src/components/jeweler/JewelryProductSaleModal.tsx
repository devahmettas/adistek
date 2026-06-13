import { FormEvent, useEffect, useMemo, useState } from 'react'
import Button from '../Button'
import Input from '../Input'
import Select from '../Select'
import { JewelrySaleProfitBreakdown } from './JewelrySaleProfitBreakdown'
import {
  createJewelrySale,
  getJewelrySettings,
  type JewelryProduct,
  type JewelrySettings,
  type MarketGoldPriceRecord,
} from '../../api/jeweler'
import {
  calculateJewelrySaleProfit,
  formatJewelryMoney,
  type JewelrySaleFinancialSettings,
} from '../../utils/jewelryPrice'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useJewelrySaleCart } from '../../context/JewelrySaleCartContext'

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'card', label: 'Kart' },
  { value: 'transfer', label: 'Havale/EFT' },
  { value: 'gold_exchange', label: 'Altın Takas' },
]

interface JewelryProductSaleModalProps {
  product: JewelryProduct
  goldPrices: MarketGoldPriceRecord[]
  onClose: () => void
  onSuccess: () => void
}

export default function JewelryProductSaleModal({
  product,
  goldPrices,
  onClose,
  onSuccess,
}: JewelryProductSaleModalProps) {
  useBodyScrollLock(true)
  const { addItem, getReservedQuantity, notifySaleCompleted } = useJewelrySaleCart()

  const catalogPrice = Number(product.sale_price)
  const previewUrl = resolveMenuAssetUrl(null, product.image_path)
  const reservedInCart = getReservedQuantity(product.id)
  const availableStock = Math.max(0, product.stock_quantity - reservedInCart)

  const [quantity, setQuantity] = useState('1')
  const [salePrice, setSalePrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jewelrySettings, setJewelrySettings] = useState<JewelrySettings | null>(null)

  useEffect(() => {
    void getJewelrySettings()
      .then(setJewelrySettings)
      .catch(() => setJewelrySettings(null))
  }, [])

  const financialSettings = useMemo<JewelrySaleFinancialSettings | undefined>(() => {
    if (!jewelrySettings) return undefined
    return {
      card_commission_rate: Number(jewelrySettings.card_commission_rate) || 0,
      tax_rate: Number(jewelrySettings.tax_rate) || 0,
    }
  }, [jewelrySettings])

  const hasSalePrice = salePrice.trim() !== ''
  const unitSalePrice = hasSalePrice ? Number(salePrice) : 0
  const qty = Math.max(1, Number(quantity) || 1)
  const discountValue = Number(discount) || 0

  const profitSummary = useMemo(
    () => calculateJewelrySaleProfit(
      unitSalePrice,
      Number(product.weight_gram),
      product.karat ?? 22,
      Number(product.labor_cost),
      qty,
      discountValue,
      catalogPrice,
      goldPrices,
      paymentMethod,
      financialSettings,
    ),
    [unitSalePrice, product, qty, discountValue, catalogPrice, goldPrices, paymentMethod, financialSettings],
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!hasSalePrice || unitSalePrice <= 0) {
      setError('Satış fiyatını girin.')
      return
    }

    if (availableStock < qty) {
      setError(
        reservedInCart > 0
          ? `Yetersiz stok. Sepette ${reservedInCart} adet var, en fazla ${availableStock} adet daha eklenebilir.`
          : `Yetersiz stok. Mevcut: ${product.stock_quantity} adet`,
      )
      return
    }

    setSubmitting(true)

    try {
      await createJewelrySale({
        payment_method: paymentMethod,
        discount: discountValue,
        items: [
          {
            product_id: product.id,
            product_name: product.name,
            quantity: qty,
            unit_price: unitSalePrice,
            weight_gram: product.weight_gram,
            labor_cost: product.labor_cost,
            line_total: profitSummary.subtotal,
          },
        ],
      })
      notifySaleCompleted()
      onSuccess()
      onClose()
    } catch {
      setError('Satış kaydedilemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddToCart = () => {
    setError(null)

    if (!hasSalePrice || unitSalePrice <= 0) {
      setError('Satış fiyatını girin.')
      return
    }

    const cartError = addItem({
      product,
      quantity: qty,
      unit_price: unitSalePrice,
      payment_method: paymentMethod,
    })

    if (cartError) {
      setError(cartError)
      return
    }

    onClose()
  }

  const profitPositive = profitSummary.totalProfit >= 0

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 lg:items-center lg:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl lg:h-[min(88vh,600px)] lg:max-h-[88vh] lg:max-w-5xl lg:flex-row lg:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-sale-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900 lg:right-4 lg:top-4 lg:h-9 lg:w-9"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto lg:flex lg:flex-row lg:overflow-hidden">
          <div className="flex shrink-0 flex-col lg:h-full lg:w-[38%] lg:min-h-0 lg:border-r lg:border-slate-100">
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/40 p-4 sm:p-5 lg:aspect-auto lg:min-h-0 lg:flex-1 lg:p-5">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain object-center"
                />
              ) : (
                <div className="flex h-36 w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400 lg:h-full">
                  Fotoğraf yok
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60 p-4 lg:shrink-0 lg:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {product.karat} ayar
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <div className="rounded-lg border border-brand-200 bg-brand-50/70 px-2.5 py-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-brand-600">Liste Fiyatı</p>
                  <p className="text-sm font-bold text-brand-700">{formatJewelryMoney(catalogPrice)}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700">Gram</p>
                  <p className="text-sm font-bold text-amber-900">{product.weight_gram} gr</p>
                </div>
              </div>

              <dl className="mt-2 text-xs">
                <div>
                  <dt className="text-slate-500">Stok</dt>
                  <dd className="font-medium text-slate-900">
                    {availableStock} adet
                    {reservedInCart > 0 && (
                      <span className="text-slate-500"> ({reservedInCart} sepette)</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:min-h-0 lg:overflow-hidden">
            <div className="shrink-0 p-4 sm:p-5 lg:px-5 lg:pb-2 lg:pt-5">
              <h2 id="product-sale-title" className="pr-9 text-xl font-bold text-slate-900 lg:text-lg">
                Ürün Satışı
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 lg:hidden">
                Satış fiyatını girerek işlemi tamamlayın.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col lg:min-h-0 lg:overflow-hidden">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 sm:px-5 lg:flex lg:flex-col lg:gap-3 lg:overflow-hidden lg:px-5 lg:pb-0">
                <div className="space-y-1 lg:shrink-0">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
                    <Input
                      label="Satış Fiyatı (₺)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="Satış fiyatını girin"
                      className="lg:py-2 lg:text-sm"
                      required
                    />

                    <Input
                      label="Adet"
                      type="number"
                      min="1"
                      max={availableStock || undefined}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="lg:py-2 lg:text-sm"
                      required
                    />

                    <Select
                      label="Ödeme Yöntemi"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      options={PAYMENT_OPTIONS}
                      className="lg:py-2 lg:text-sm"
                    />

                    <Input
                      label="Ek İndirim (₺)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="lg:py-2 lg:text-sm"
                    />
                  </div>

                  {hasSalePrice && profitSummary.priceDifference !== 0 && (
                    <p className={`text-xs font-medium ${profitSummary.priceDifference > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      Liste fiyatından {profitSummary.priceDifference > 0 ? '+' : ''}
                      {formatJewelryMoney(profitSummary.priceDifference)} fark
                    </p>
                  )}
                </div>

                {hasSalePrice ? (
                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-3 lg:overflow-hidden">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm lg:flex lg:min-h-0 lg:flex-col lg:p-3 lg:text-xs">
                      <p className="shrink-0 font-semibold text-slate-900">Satış özeti</p>
                      <div className="mt-2 flex flex-1 flex-col justify-center space-y-1.5 lg:mt-1.5">
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500">Ara toplam</span>
                          <span className="font-medium">{formatJewelryMoney(profitSummary.subtotal)}</span>
                        </div>
                        {profitSummary.discount > 0 && (
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-500">İndirim</span>
                            <span className="font-medium text-red-600">-{formatJewelryMoney(profitSummary.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-3 border-t border-slate-200 pt-1.5">
                          <span className="font-semibold text-slate-900">Tahsil edilecek</span>
                          <span className="text-base font-bold text-brand-700 lg:text-sm">
                            {formatJewelryMoney(profitSummary.totalRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 text-sm lg:flex lg:min-h-0 lg:flex-col lg:p-3 lg:text-xs ${profitPositive ? 'border-emerald-100 bg-emerald-50/80' : 'border-red-100 bg-red-50/80'}`}>
                      <p className="shrink-0 font-semibold text-slate-900">Karlılık analizi</p>
                      <dl className="mt-2 grid flex-1 grid-cols-2 gap-x-3 gap-y-1 lg:mt-1.5 lg:content-center">
                        {profitSummary.goldPricePerGram !== null && (
                          <div>
                            <dt className="text-slate-500">Altın değeri</dt>
                            <dd className="font-medium text-slate-900">{formatJewelryMoney(profitSummary.metalValue)}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-slate-500">İşçilik</dt>
                          <dd className="font-medium text-slate-900">{formatJewelryMoney(profitSummary.laborCost)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Birim maliyet</dt>
                          <dd className="font-medium text-slate-900">{formatJewelryMoney(profitSummary.unitCost)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Birim kar</dt>
                          <dd className={`font-semibold ${profitSummary.unitProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {formatJewelryMoney(profitSummary.unitProfit)}
                          </dd>
                        </div>
                        <div className="col-span-2 border-t border-slate-200/80 pt-1">
                          <JewelrySaleProfitBreakdown
                            summary={profitSummary}
                            paymentMethod={paymentMethod}
                            compact
                          />
                        </div>
                      </dl>
                      {!profitPositive && (
                        <p className="mt-1.5 shrink-0 text-[11px] text-red-600 lg:mt-1">
                          Bu fiyattan satış zararlı görünüyor.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-500 lg:shrink-0 lg:py-3 lg:text-xs">
                    Kar ve satış özeti için satış fiyatını girin.
                  </p>
                )}

                {error && <p className="shrink-0 text-sm text-red-600 lg:text-xs">{error}</p>}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-100 p-4 lg:px-5 lg:py-3">
                <Button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={availableStock < 1 || !hasSalePrice}
                >
                  Sepete Ekle
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={submitting || availableStock < 1 || !hasSalePrice}
                >
                  {submitting ? 'Kaydediliyor...' : 'Hemen Sat'}
                </Button>
                <Button type="button" variant="ghost" className="lg:w-auto" onClick={onClose}>
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
