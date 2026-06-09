import type { Category } from '../api/types'
import MenuProductImage from './menu/MenuProductImage'

interface StaffCategoryPickerCardProps {
  category: Category
  productCount: number
  onClick?: () => void
  disabled?: boolean
}

export default function StaffCategoryPickerCard({
  category,
  productCount,
  onClick,
  disabled = false,
}: StaffCategoryPickerCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="overflow-hidden rounded-xl border border-blue-100 bg-white text-left shadow-sm transition hover:border-blue-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="aspect-square w-full overflow-hidden bg-slate-100">
        <MenuProductImage
          name={category.name}
          imageUrl={category.image_url}
          imagePath={category.image_path}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-0.5 p-2">
        <p className="line-clamp-2 text-xs font-bold leading-tight text-gray-900 sm:text-sm">
          {category.name}
        </p>
        <p className="text-[10px] text-gray-500 sm:text-xs">{productCount} ürün</p>
      </div>
    </button>
  )
}
