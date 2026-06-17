import type { Product } from '../api/types'
import Button from './Button'
import AllergenBadges from './menu/AllergenBadges'
import CalorieBadge from './menu/CalorieBadge'
import MenuProductImage from './menu/MenuProductImage'

interface StaffProductAddPanelProps {
  product: Product
  quantity: number
  note: string
  submitting: boolean
  feedback: string | null
  onQuantityChange: (quantity: number) => void
  onNoteChange: (note: string) => void
  onCancel: () => void
  onConfirm: () => void
}

function ProductMeta({ product }: { product: Product }) {
  const hasCalories = product.calories != null && product.calories > 0
  const hasAllergens = (product.allergens ?? []).length > 0

  return (
    <div className="rounded-xl border border-slate-100 bg-white/90 px-2.5 py-2 lg:px-3 lg:py-2.5">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-slate-500 lg:text-[11px]">Kalori</span>
          {hasCalories ? (
            <CalorieBadge calories={product.calories!} compact />
          ) : (
            <span className="text-[10px] text-slate-400 lg:text-[11px]">—</span>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="shrink-0 text-[10px] font-medium text-slate-500 lg:text-[11px]">Alerjen</span>
          {hasAllergens ? (
            <AllergenBadges allergens={product.allergens} compact />
          ) : (
            <span className="text-[10px] text-slate-400 lg:text-[11px]">Yok</span>
          )}
        </div>
      </div>

      {product.description && (
        <div className="mt-2 border-t border-slate-100 pt-2 lg:mt-2.5 lg:pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 lg:text-[11px]">
            Açıklama
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-600 lg:line-clamp-3 lg:text-sm lg:leading-relaxed">
            {product.description}
          </p>
        </div>
      )}
    </div>
  )
}

interface OrderControlsProps {
  quantity: number
  note: string
  lineTotal: number
  submitting: boolean
  feedback: string | null
  onQuantityChange: (quantity: number) => void
  onNoteChange: (note: string) => void
  onCancel: () => void
  onConfirm: () => void
}

function OrderControls({
  quantity,
  note,
  lineTotal,
  submitting,
  feedback,
  onQuantityChange,
  onNoteChange,
  onCancel,
  onConfirm,
}: OrderControlsProps) {
  return (
    <div className="space-y-2 rounded-xl border border-emerald-100 bg-white p-2.5 lg:space-y-2.5 lg:p-3">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 lg:gap-3 lg:px-3 lg:py-2.5">
        <span className="text-xs font-semibold text-slate-800 lg:text-sm">Adet</span>

        <div className="flex items-center gap-1.5 lg:gap-2">
          <button
            type="button"
            disabled={quantity <= 1}
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 lg:h-10 lg:w-10 lg:text-base"
          >
            −
          </button>
          <span className="min-w-[1.5rem] text-center text-sm font-bold text-slate-900 lg:min-w-[1.75rem] lg:text-lg">
            {quantity}
          </span>
          <button
            type="button"
            disabled={quantity >= 99}
            onClick={() => onQuantityChange(Math.min(99, quantity + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-400 bg-brand-600 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-40 lg:h-10 lg:w-10 lg:text-base"
          >
            +
          </button>
        </div>

        <div className="text-right">
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500 lg:text-[10px]">
            Toplam
          </p>
          <p className="text-xs font-extrabold text-brand-700 lg:text-base">
            {lineTotal.toFixed(2)} ₺
          </p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-4">
        <div>
          <label htmlFor="staff-add-note" className="mb-1 block text-[11px] font-semibold text-slate-700 lg:text-xs">
            Sipariş notu <span className="font-normal text-slate-400">(opsiyonel)</span>
          </label>
          <input
            id="staff-add-note"
            type="text"
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Örn: buzsuz, az pişmiş"
            className="input-field px-2.5 py-2 lg:px-3"
          />
        </div>

        <div className="hidden lg:grid lg:w-72 lg:grid-cols-5 lg:gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
            className="col-span-2 h-10 rounded-xl text-sm"
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="col-span-3 h-10 rounded-xl text-sm font-bold"
          >
            {submitting ? 'Ekleniyor...' : 'Masaya Ekle'}
          </Button>
        </div>
      </div>

      {feedback && (
        <p
          className={`rounded-lg px-2 py-1 text-[11px] font-medium lg:px-2.5 lg:py-1.5 lg:text-xs ${
            feedback.includes('eklenemedi')
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {feedback}
        </p>
      )}

      <div className="grid grid-cols-5 gap-1.5 lg:hidden">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
          className="col-span-2 h-9 rounded-xl text-xs"
        >
          İptal
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="col-span-3 h-9 rounded-xl text-xs font-bold"
        >
          {submitting ? 'Ekleniyor...' : 'Masaya Ekle'}
        </Button>
      </div>
    </div>
  )
}

export default function StaffProductAddPanel({
  product,
  quantity,
  note,
  submitting,
  feedback,
  onQuantityChange,
  onNoteChange,
  onCancel,
  onConfirm,
}: StaffProductAddPanelProps) {
  const unitPrice = Number(product.price)
  const lineTotal = unitPrice * quantity

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-white shadow-md lg:rounded-3xl">
      <div className="p-2.5 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-8 lg:p-6 xl:grid-cols-[280px_1fr] xl:gap-10">
        <div className="flex flex-col items-center lg:items-stretch">
          <div className="aspect-square w-full max-w-[19rem] overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-md lg:max-w-none lg:rounded-xl">
            <MenuProductImage
              name={product.name}
              imageUrl={product.image_url}
              imagePath={product.image_path}
              eager
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="mt-2 w-full min-w-0 text-center lg:mt-0 lg:flex lg:flex-col lg:gap-3 lg:text-left">
          <div>
            <h4 className="text-base font-bold leading-snug text-slate-900 lg:text-2xl">
              {product.name}
            </h4>
            <p className="mt-0.5 text-xl font-extrabold tracking-tight text-brand-700 lg:mt-1 lg:text-3xl">
              {unitPrice.toFixed(2)} ₺
            </p>
          </div>

          <ProductMeta product={product} />

          <OrderControls
            quantity={quantity}
            note={note}
            lineTotal={lineTotal}
            submitting={submitting}
            feedback={feedback}
            onQuantityChange={onQuantityChange}
            onNoteChange={onNoteChange}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        </div>
      </div>
    </div>
  )
}
