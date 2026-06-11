import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PublicMenuProduct } from '../../api/publicMenu'
import MenuProductCard from './MenuProductCard'

interface MenuProductsPanelProps {
  title: string
  products: PublicMenuProduct[]
  panelRef?: (element: HTMLDivElement | null) => void
  renderProductExtra?: (product: PublicMenuProduct, index: number) => {
    onClick?: () => void
    action?: ReactNode
  }
}

export default function MenuProductsPanel({
  title,
  products,
  panelRef,
  renderProductExtra,
}: MenuProductsPanelProps) {
  const { t } = useTranslation()

  return (
    <div ref={panelRef} className="menu-products-view menu-section-reveal">
      <div className="menu-products-view__head">
        <h2 className="menu-products-view__title">{title}</h2>
        <p className="menu-products-view__count">
          {products.length} {t('common.products')}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="menu-empty-state">
          <p>{t('common.noProducts')}</p>
        </div>
      ) : (
        <div className="menu-product-grid">
          {products.map((product, index) => {
            const extra = renderProductExtra?.(product, index)

            return (
              <MenuProductCard
                key={product.id}
                product={product}
                index={index}
                variant="grid"
                onClick={extra?.onClick}
                action={extra?.action}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
