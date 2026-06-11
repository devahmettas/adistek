import { useTranslation } from 'react-i18next'
import type { PublicMenuCategory } from '../../api/publicMenu'
import { MENU_HERO_FALLBACK_IMAGES } from '../../constants/menuImagery'
import { resolveMenuAssetUrl } from '../../utils/menuAssetUrl'

interface MenuCategoryGridProps {
  categories: PublicMenuCategory[]
  totalProductCount: number
  onSelectAll: () => void
  onSelect: (categoryId: number) => void
}

export default function MenuCategoryGrid({
  categories,
  totalProductCount,
  onSelectAll,
  onSelect,
}: MenuCategoryGridProps) {
  const { t } = useTranslation()

  return (
    <div className="menu-category-grid">
      <button
        type="button"
        onClick={onSelectAll}
        className="menu-category-tile menu-category-tile--all menu-section-reveal"
      >
        <img
          src={MENU_HERO_FALLBACK_IMAGES[1]}
          alt=""
          className="menu-category-tile__image"
          aria-hidden
        />
        <div className="menu-category-tile__overlay" />
        <div className="menu-category-tile__content">
          <p className="menu-category-tile__kicker">{t('common.menuEyebrow')}</p>
          <h2 className="menu-category-tile__name">{t('common.allProducts')}</h2>
          {totalProductCount > 0 && (
            <span className="menu-category-tile__count">{totalProductCount}</span>
          )}
        </div>
      </button>

      {categories.map((category, index) => {
        const imageUrl = resolveMenuAssetUrl(category.image_url, category.image_path)

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className="menu-category-tile menu-section-reveal"
            style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="menu-category-tile__image" aria-hidden />
            ) : (
              <div className="menu-category-tile__fallback" aria-hidden />
            )}
            <div className="menu-category-tile__overlay" />
            <div className="menu-category-tile__content">
              <h2 className="menu-category-tile__name">{category.name}</h2>
              {category.products.length > 0 && (
                <span className="menu-category-tile__count">{category.products.length}</span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
