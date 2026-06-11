import { MENU_PLACEHOLDER_PATTERN } from '../../constants/menuImagery'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'

interface MenuProductImageProps {
  name: string
  imageUrl?: string | null
  imagePath?: string | null
  className?: string
  eager?: boolean
  variant?: 'default' | 'menu'
}

export default function MenuProductImage({
  name,
  imageUrl,
  imagePath,
  className = 'h-full w-full object-cover',
  eager = false,
  variant = 'default',
}: MenuProductImageProps) {
  const src = resolveMenuAssetUrl(imageUrl, imagePath)

  if (!src) {
    if (variant === 'menu') {
      return (
        <div className="menu-product-placeholder">
          <img
            src={MENU_PLACEHOLDER_PATTERN}
            alt=""
            className="menu-product-placeholder__pattern"
            aria-hidden
          />
          <div className="menu-product-placeholder__veil" />
        </div>
      )
    }

    return (
      <div className="flex h-full min-h-[140px] items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
        <svg viewBox="0 0 24 24" fill="none" className="h-12 w-12 text-brand-300" aria-hidden>
          <path
            d="M6 14h12M8 10h8M10 6h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      loading={eager ? 'eager' : 'lazy'}
      className={className}
    />
  )
}
