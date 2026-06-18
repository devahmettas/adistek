import { FormEvent, useEffect, useMemo, useState } from 'react'
import Button from '../Button'
import Input from '../Input'
import MoneyInput from '../MoneyInput'
import Select from '../Select'
import type { JewelryCategory, JewelryProduct, MarketGoldPriceRecord } from '../../api/jeweler'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import {
  calculatePurchaseLineMarketValue,
  calculatePurchaseLinePaid,
  getPurchaseUnitMarketPrice,
  getSuggestedPurchaseLineTotal,
  getSuggestedPurchaseUnitPrice,
  GOLD_PURCHASE_CATEGORY_NAMES,
  type GoldPurchaseQuickType,
  type PurchaseFormItem,
} from '../../utils/jewelryPurchaseGold'
import { formatJewelryMoney, KARAT_OPTIONS } from '../../utils/jewelryPrice'

interface JewelryPurchaseItemModalProps {
  item: PurchaseFormItem
  quickType?: GoldPurchaseQuickType | null
  mode: 'quick-gold' | 'custom'
  categories: JewelryCategory[]
  products: JewelryProduct[]
  goldPrices: MarketGoldPriceRecord[]
  onClose: () => void
  onSave: (item: PurchaseFormItem) => void
}

export default function JewelryPurchaseItemModal({
  item,
  quickType = null,
  mode,
  categories,
  products,
  goldPrices,
  onClose,
  onSave,
}: JewelryPurchaseItemModalProps) {
  useBodyScrollLock(true)

  const [draft, setDraft] = useState<PurchaseFormItem>(item)

  useEffect(() => {
    setDraft(item)
  }, [item])

  const unitMarketPrice = useMemo(
    () => getPurchaseUnitMarketPrice(draft, goldPrices),
    [draft, goldPrices],
  )
  const suggestedLineTotal = useMemo(
    () => getSuggestedPurchaseLineTotal(draft, goldPrices),
    [draft, goldPrices],
  )
  const suggestedUnitPrice = useMemo(
    () => (draft.pricing_mode === 'piece' ? getSuggestedPurchaseUnitPrice(draft, goldPrices) : null),
    [draft, goldPrices],
  )
  const unitLabel = draft.pricing_mode === 'piece' ? 'adet' : 'gr'

  const paidTotal = useMemo(() => calculatePurchaseLinePaid(draft), [draft])
  const marketValue = useMemo(
    () => calculatePurchaseLineMarketValue(draft, goldPrices),
    [draft, goldPrices],
  )
  const savings = Math.round((marketValue - paidTotal) * 100) / 100

  const categoryOptions = [
    { value: '', label: 'Kategori seçin (opsiyonel)' },
    ...categories
      .filter((category) => !GOLD_PURCHASE_CATEGORY_NAMES.includes(category.name))
      .map((category) => ({ value: String(category.id), label: category.name })),
  ]

  const productOptions = [
    { value: '', label: 'Stoka bağlama' },
    ...products.map((product) => ({ value: String(product.id), label: product.name })),
  ]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!draft.item_description.trim()) {
      return
    }

    if (paidTotal <= 0) {
      return
    }

    onSave(draft)
    onClose()
  }

  const title = mode === 'quick-gold'
    ? `${quickType?.label ?? 'Altın'} Ekle`
    : draft.item_description
      ? 'Kalemi Düzenle'
      : 'Kalem Ekle'

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
                ? 'Güncel fiyatları kontrol edip ödeme tutarını kendiniz girin.'
                : 'Ürün açıklaması ve alım detaylarını girin.'}
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
              placeholder="Örn. 22 ayar bilezik, hurda ziynet"
              required
              autoFocus
            />
          )}

          {mode === 'quick-gold' && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">{draft.item_description}</p>
            </div>
          )}

          {mode === 'quick-gold' && (unitMarketPrice !== null || suggestedLineTotal !== null || suggestedUnitPrice !== null) && (
            <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              {draft.pricing_mode === 'gram' ? (
                <>
                  {marketValue > 0 && (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Güncel piyasa değeri</span>
                      <span className="font-semibold text-slate-900">
                        {formatJewelryMoney(marketValue)}
                      </span>
                    </div>
                  )}
                  {suggestedLineTotal !== null && (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Önerilen alış tutarı</span>
                      <span className="font-semibold text-brand-700">
                        {formatJewelryMoney(suggestedLineTotal)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {unitMarketPrice !== null && (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Güncel piyasa</span>
                      <span className="font-semibold text-slate-900">
                        {formatJewelryMoney(unitMarketPrice)} / {unitLabel}
                      </span>
                    </div>
                  )}
                  {suggestedUnitPrice !== null && (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Önerilen alış fiyatı</span>
                      <span className="font-semibold text-brand-700">
                        {formatJewelryMoney(suggestedUnitPrice)} / {unitLabel}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {mode === 'quick-gold' ? (
            <Input
              label="Adet"
              type="number"
              min="1"
              value={draft.quantity}
              onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))}
              required
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Adet"
                type="number"
                min="1"
                value={draft.quantity}
                onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))}
                required
              />
              <Input
                label="Gram"
                type="number"
                step="0.001"
                min="0.001"
                value={draft.weight_gram}
                onChange={(event) => setDraft((current) => ({ ...current, weight_gram: event.target.value }))}
                placeholder="Örn. 12.5"
              />
            </div>
          )}

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
            label={mode === 'custom' || draft.pricing_mode === 'gram' ? 'Ödeme tutarı (₺)' : 'Ödeme (₺/adet)'}
            value={draft.unit_price}
            onValueChange={(value) => setDraft((current) => ({ ...current, unit_price: value }))}
            placeholder="Tutarı girin"
            required
          />

          {mode === 'custom' && (
            <Select
              label="Stoka bağla (opsiyonel)"
              value={draft.product_id}
              onChange={(event) => setDraft((current) => ({ ...current, product_id: event.target.value }))}
              options={productOptions}
            />
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Ödenecek tutar</span>
              <span className="font-semibold text-slate-900">{formatJewelryMoney(paidTotal)}</span>
            </div>
            {marketValue > 0 && (
              <>
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-slate-500">Toplam piyasa değeri</span>
                  <span className="font-semibold text-slate-900">{formatJewelryMoney(marketValue)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3 border-t border-slate-200 pt-2">
                  <span className="font-medium text-slate-700">Uyguna alım</span>
                  <span className={`font-bold ${savings >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {savings >= 0 ? '+' : ''}{formatJewelryMoney(savings)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>İptal</Button>
            <Button type="submit">Kaleme Ekle</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
