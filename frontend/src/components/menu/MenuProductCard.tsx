import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PublicMenuProduct } from '../../api/publicMenu'
import { getMenuLanguage } from '../../i18n'
import { formatMenuPrice } from '../../utils/formatMenuPrice'
import AllergenBadges from './AllergenBadges'
import CalorieBadge from './CalorieBadge'
import MenuProductImage from './MenuProductImage'

interface MenuProductCardProps {
  product: PublicMenuProduct
  index?: number
  action?: ReactNode
  onClick?: () => void
}

export default function MenuProductCard({ product, index = 0, action, onClick }: MenuProductCardProps) {
  const { i18n } = useTranslation()
  const language = getMenuLanguage() ?? (i18n.language as 'tr')
  const Wrapper = onClick ? 'button' : 'article'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`menu-product-card group w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-panel ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 sm:aspect-auto sm:h-auto sm:w-36 md:w-44">
          <MenuProductImage
            name={product.name}
            imageUrl={product.image_url}
            imagePath={product.image_path}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">{product.name}</h3>
              {product.description && (
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
                  {product.description}
                </p>
              )}
            </div>
            <p className="shrink-0 rounded-2xl bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-800">
              {formatMenuPrice(product.price, language)}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {product.calories != null && product.calories > 0 && (
              <CalorieBadge calories={product.calories} />
            )}
          </div>

          <AllergenBadges allergens={product.allergens} />

          {action && <div className="mt-4 flex justify-end">{action}</div>}
        </div>
      </div>
    </Wrapper>
  )
}
