import type { ReactNode } from 'react'
import type { PublicMenuCategory } from '../../api/publicMenu'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'

interface MenuCategorySectionProps {
  category: PublicMenuCategory
  sectionRef?: (element: HTMLElement | null) => void
  children: ReactNode
  productCount?: boolean
}

export default function MenuCategorySection({
  category,
  sectionRef,
  children,
  productCount = true,
}: MenuCategorySectionProps) {
  const categoryImageUrl = resolveMenuAssetUrl(category.image_url, category.image_path)

  return (
    <section ref={sectionRef} id={`category-${category.id}`} className="menu-category scroll-mt-44">
      <div className="menu-category-header">
        {categoryImageUrl ? (
          <div className="menu-category-header__media">
            <img src={categoryImageUrl} alt="" className="menu-category-header__image" aria-hidden />
            <div className="menu-category-header__overlay" />
          </div>
        ) : (
          <div className="menu-category-header__media menu-category-header__media--fallback" />
        )}

        <div className="menu-category-header__content">
          <div className="menu-category-header__ornament" aria-hidden>
            <span />
            <span />
          </div>
          <h2 className="menu-category-header__title">{category.name}</h2>
          {productCount && category.products.length > 0 && (
            <p className="menu-category-header__count">{category.products.length}</p>
          )}
        </div>
      </div>

      <div className="menu-category-products">{children}</div>
    </section>
  )
}
