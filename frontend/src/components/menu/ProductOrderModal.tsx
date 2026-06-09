import { useState } from 'react'
import type { PublicMenuProduct } from '../../api/publicMenu'
import AllergenBadges from './AllergenBadges'
import CalorieBadge from './CalorieBadge'
import MenuProductImage from './MenuProductImage'

interface ProductOrderModalProps {
  product: PublicMenuProduct
  submitting: boolean
  onClose: () => void
  onConfirm: (quantity: number, note: string) => void
}

function formatPrice(price: string): string {
  return `${Number(price).toFixed(2)} ₺`
}

export default function ProductOrderModal({
  product,
  submitting,
  onClose,
  onConfirm,
}: ProductOrderModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const hasCalories = product.calories != null && product.calories > 0
  const hasAllergens = product.allergens.length > 0
  const hasNutritionInfo = hasCalories || hasAllergens

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="max-h-[92vh] overflow-y-auto">
          <div className="relative h-48 overflow-hidden bg-slate-100 sm:h-52">
            <MenuProductImage
              name={product.name}
              imageUrl={product.image_url}
              imagePath={product.image_path}
              eager
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-base text-white backdrop-blur-sm"
              aria-label="Kapat"
            >
              ×
            </button>
          </div>

          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{product.name}</h2>
            <p className="mt-1 text-base font-bold text-brand-800">{formatPrice(product.price)}</p>

            {hasNutritionInfo && (
              <div className="mt-2.5 space-y-1.5">
                {hasCalories && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500">Kalori</span>
                    <CalorieBadge calories={product.calories!} compact />
                  </div>
                )}

                {hasAllergens && (
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="mt-1 shrink-0 text-[11px] font-medium text-slate-500">
                      Alerjen
                    </span>
                    <AllergenBadges allergens={product.allergens} compact />
                  </div>
                )}
              </div>
            )}

            {product.description && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{product.description}</p>
            )}
          </div>

          <div className="space-y-4 px-5 py-4">
            <div>
              <label htmlFor="add-quantity" className="mb-2 block text-sm font-medium text-slate-700">
                Adet
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-white"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="add-note" className="mb-2 block text-sm font-medium text-slate-700">
                Sipariş notu <span className="font-normal text-slate-400">(isteğe bağlı)</span>
              </label>
              <textarea
                id="add-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Örn: Az pişmiş, sos ayrı, buzlu olmasın..."
                rows={3}
                maxLength={255}
                className="input-field resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => onConfirm(quantity, note)}
              disabled={submitting}
              className="flex-1 rounded-2xl bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              Sepete Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
