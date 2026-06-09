import type { Product } from '../api/types'
import AllergenBadges from './menu/AllergenBadges'
import CalorieBadge from './menu/CalorieBadge'
import MenuProductImage from './menu/MenuProductImage'

interface StaffProductPickerCardProps {
  product: Product
  onClick?: () => void
  disabled?: boolean
  asButton?: boolean
}

export default function StaffProductPickerCard({
  product,
  onClick,
  disabled = false,
  asButton = true,
}: StaffProductPickerCardProps) {
  const hasCalories = product.calories != null && product.calories > 0
  const hasAllergens = (product.allergens ?? []).length > 0

  const content = (
    <>
      <div className="aspect-square w-full overflow-hidden bg-slate-100">
        <MenuProductImage
          name={product.name}
          imageUrl={product.image_url}
          imagePath={product.image_path}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-1 p-2">
        <p className="line-clamp-2 text-xs font-bold leading-tight text-gray-900">{product.name}</p>
        <p className="text-xs font-bold text-blue-700">{Number(product.price).toFixed(2)} ₺</p>
        {(hasCalories || hasAllergens) && (
          <div className="flex flex-wrap gap-1">
            {hasCalories && <CalorieBadge calories={product.calories!} compact />}
            {hasAllergens && <AllergenBadges allergens={product.allergens} compact />}
          </div>
        )}
      </div>
    </>
  )

  if (!asButton) {
    return (
      <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="overflow-hidden rounded-xl border border-emerald-100 bg-white text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md disabled:opacity-60"
    >
      {content}
    </button>
  )
}
