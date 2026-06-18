import { FormEvent, useEffect, useMemo, useState } from 'react'
import Button from '../Button'
import Input from '../Input'
import MoneyInput from '../MoneyInput'
import Select from '../Select'
import type { JewelryCategory, JewelryProduct, MarketGoldPriceRecord } from '../../api/jeweler'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import {
  calculateSaleLineMarketValue,
  calculateSaleLineTotal,
  getSaleUnitMarketPrice,
  getSuggestedSaleUnitPrice,
  type GoldPurchaseQuickType,
  type SaleFormItem,
} from '../../utils/jewelrySaleGold'
import { formatJewelryMoney, KARAT_OPTIONS } from '../../utils/jewelryPrice'

interface JewelrySaleItemModalProps {
  item: SaleFormItem
  quickType?: GoldPurchaseQuickType | null
  mode: 'quick-gold' | 'custom'
  categories: JewelryCategory[]
  products: JewelryProduct[]
  goldPrices: MarketGoldPriceRecord[]
  maxQuantity?: number | null
  onClose: () => void
  onSave: (item: SaleFormItem) => void
}

export default function JewelrySaleItemModal({
  item,
  quickType = null,
  mode,
  categories,
  products,
  goldPrices,
  maxQuantity = null,
  onClose,
  onSave,
}: JewelrySaleItemModalProps) {
  useBodyScrollLock(true)

  const [draft, setDraft] = useState<SaleFormItem>(item)

  useEffect(() => {
    setDraft(item)
  }, [item])

  const unitMarketPrice = useMemo(
    () => getSaleUnitMarketPrice(draft, goldPrices),
    [draft, goldPrices],
  )
  const suggestedUnitPrice = useMemo(
    () => getSuggestedSaleUnitPrice(draft, goldPrices),
    [draft, goldPrices],
  )
  const unitLabel = draft.pricing_mode === 'piece' ? 'adet' : 'gr'

  const lineTotal = useMemo(() => calculateSaleLineTotal(draft), [draft])
  const marketValue = useMemo(
    () => calculateSaleLineMarketValue(draft, goldPrices),
    [draft, goldPrices],
  )
  const priceDifference = Math.round((lineTotal - marketValue) * 100) / 100
  const quantityLimit = maxQuantity ?? null
  const currentQuantity = Math.max(1, Number(draft.quantity) || 1)

  const handleQuantityChange = (value: string) => {
    const parsed = Math.max(1, Number(value) || 1)
    const nextQuantity = quantityLimit !== null ? Math.min(parsed, quantityLimit) : parsed

    setDraft((current) => ({ ...current, quantity: String(nextQuantity) }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!draft.item_description.trim()) {
      return
    }

    if (draft.pricing_mode === 'gram' && !(Number(draft.weight_gram) > 0)) {
      return
    }

    if (lineTotal <= 0) {
      return
    }

    if (quantityLimit !== null && currentQuantity > quantityLimit) {
      return
    }

    onSave({
      ...draft,
      quantity: String(currentQuantity),
    })
    onClose()
  }

  const categoryOptions = [
    { value: '', label: 'Kategori seçin (opsiyonel)' },
    ...categories.map((category) => ({ value: String(category.id), label: category.name })),
  ]

  const stockProducts = products.filter((product) => product.stock_quantity > 0)
  const categoryProductOptions = draft.category_id
    ? stockProducts.filter((product) => product.category_id === Number(draft.category_id))
    : stockProducts

  const productOptions = [
    { value: '', label: 'Stoktan seç (opsiyonel)' },
    ...categoryProductOptions.map((product) => ({
      value: String(product.id),
      label: `${product.name} (${product.stock_quantity} adet)`,
    })),
  ]

  const handleProductSelect = (productId: string) => {
    const product = products.find((row) => row.id === Number(productId))
    setDraft((current) => ({
      ...current,
      product_id: productId,
      ...(product ? {
        item_description: product.name,
        karat: String(product.karat ?? 22),
        weight_gram: String(product.weight_gram),
        category_id: product.category_id ? String(product.category_id) : current.category_id,
        pricing_mode: 'piece',
      } : {}),
    }))
  }

  const title = mode === 'quick-gold'
    ? `${quickType?.label ?? 'Altın'} Satışı`
    : draft.item_description
      ? 'Kalemi Düzenle'
      : 'Ürün Ekle'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden overscroll-behavior-contain bg-slate-900/50 p-3 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Kapat" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'quick-gold'
                ? 'Güncel satış fiyatlarını kontrol edip tahsil tutarını girin.'
                : 'Ürün açıklaması ve satış detaylarını girin.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'custom' && (
            <Input
              label="Ürün Açıklaması"
              value={draft.item_description}
              onChange={(event) => setDraft((current) => ({
                ...current,
                item_description: event.target.value,
              }))}
              placeholder="Örn. 22 ayar bilezik, çeyrek altın"
              required
              autoFocus
            />
          )}

          {mode === 'quick-gold' && (
            <div className="rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-brand-900">{draft.item_description}</p>
            </div>
          )}

          {(unitMarketPrice !== null || suggestedUnitPrice !== null) && (
            <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              {unitMarketPrice !== null && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Güncel piyasa satış</span>
                  <span className="font-semibold text-slate-900">
                    {formatJewelryMoney(unitMarketPrice)} / {unitLabel}
                  </span>
                </div>
              )}
              {suggestedUnitPrice !== null && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Önerilen satış fiyatı</span>
                  <span className="font-semibold text-brand-700">
                    {formatJewelryMoney(suggestedUnitPrice)} / {unitLabel}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Input
                label="Adet"
                type="number"
                min="1"
                max={quantityLimit ?? undefined}
                value={draft.quantity}
                onChange={(event) => handleQuantityChange(event.target.value)}
                required
              />
              {quantityLimit !== null && (
                <p className="mt-1 text-xs text-slate-500">
                  Maksimum {quantityLimit} adet seçilebilir
                </p>
              )}
            </div>

            {draft.pricing_mode === 'gram' ? (
              <Input
                label="Gram"
                type="number"
                step="0.001"
                min="0.001"
                value={draft.weight_gram}
                onChange={(event) => setDraft((current) => ({ ...current, weight_gram: event.target.value }))}
                required
              />
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-xs font-medium text-slate-500">Birim tipi</p>
                <p className="text-sm font-semibold text-slate-800">Adet bazlı altın</p>
              </div>
            )}
          </div>

          {mode === 'custom' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Ayar"
                value={draft.karat}
                onChange={(event) => setDraft((current) => ({ ...current, karat: event.target.value }))}
                options={KARAT_OPTIONS.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
              />
              <Select
                label="Kategori"
                value={draft.category_id}
                onChange={(event) => setDraft((current) => ({ ...current, category_id: event.target.value }))}
                options={categoryOptions}
              />
            </div>
          )}

          <MoneyInput
            label={draft.pricing_mode === 'piece' ? 'Satış fiyatı (₺/adet)' : 'Satış fiyatı (₺/gr)'}
            value={draft.unit_price}
            onValueChange={(value) => setDraft((current) => ({ ...current, unit_price: value }))}
            placeholder="Tutarı girin"
            required
          />

          <Select
            label="Stoktan bağla (opsiyonel)"
            value={draft.product_id}
            onChange={(event) => handleProductSelect(event.target.value)}
            options={productOptions}
          />

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Tahsil edilecek</span>
              <span className="font-semibold text-slate-900">{formatJewelryMoney(lineTotal)}</span>
            </div>
            {marketValue > 0 && (
              <>
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-slate-500">Piyasa değeri</span>
                  <span className="font-semibold text-slate-900">{formatJewelryMoney(marketValue)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3 border-t border-slate-200 pt-2">
                  <span className="font-medium text-slate-700">Piyasa farkı</span>
                  <span className={`font-bold ${priceDifference >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {priceDifference >= 0 ? '+' : ''}{formatJewelryMoney(priceDifference)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>İptal</Button>
            <Button
              type="submit"
              disabled={quantityLimit !== null && quantityLimit < 1}
            >
              Kaleme Ekle
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
