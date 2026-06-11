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
  variant?: 'default' | 'grid'
}

export default function MenuProductCard({
  product,
  index = 0,
  action,
  onClick,
  variant = 'grid',
}: MenuProductCardProps) {
  const { i18n } = useTranslation()
  const language = getMenuLanguage() ?? (i18n.language as 'tr')
  const Wrapper = onClick ? 'button' : 'article'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`menu-product-card menu-product-card--${variant} group ${
        onClick ? 'menu-product-card--interactive' : ''
      }`}
      style={{ animationDelay: `${Math.min(index, 10) * 70}ms` }}
    >
      <div className="menu-product-card__image-wrap">
        <MenuProductImage
          name={product.name}
          imageUrl={product.image_url}
          imagePath={product.image_path}
          variant="menu"
          className="menu-product-card__image"
        />
        <div className="menu-product-card__price-badge">
          {formatMenuPrice(product.price, language)}
        </div>
      </div>

      <div className="menu-product-card__body">
        <div className="menu-product-card__header">
          <h3 className="menu-product-card__name">{product.name}</h3>
        </div>

        {product.description && (
          <p className="menu-product-card__description">{product.description}</p>
        )}

        <div className="menu-product-card__meta">
          {product.calories != null && product.calories > 0 && (
            <CalorieBadge calories={product.calories} compact />
          )}
          <AllergenBadges allergens={product.allergens} compact />
        </div>

        {action && <div className="menu-product-card__action">{action}</div>}
      </div>
    </Wrapper>
  )
}
