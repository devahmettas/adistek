import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PublicMenuSettings, PublicMenuSlide } from '../api/publicMenu'
import { ALL_PRODUCTS_VIEW, type MenuCategorySelection } from '../utils/menuCategoryView'
import LanguageSwitcher from './menu/LanguageSwitcher'
import MenuHeroSlider from './menu/MenuHeroSlider'

interface PublicPageShellProps {
  eyebrow?: string
  title: string
  description?: string
  menuSettings?: PublicMenuSettings
  slides?: PublicMenuSlide[]
  categories?: { id: number; name: string }[]
  activeCategoryId?: MenuCategorySelection | null
  onCategoryClick?: (categoryId: MenuCategorySelection) => void
  showCategoryNav?: boolean
  onBackToCategories?: () => void
  children: ReactNode
  footer?: ReactNode | null
  hideFooter?: boolean
}

export default function PublicPageShell({
  eyebrow,
  title,
  description,
  menuSettings,
  slides = [],
  categories,
  activeCategoryId,
  onCategoryClick,
  showCategoryNav = false,
  onBackToCategories,
  children,
  footer,
  hideFooter = false,
}: PublicPageShellProps) {
  const { t } = useTranslation()
  const tagline = menuSettings?.tagline
  const welcomeText = menuSettings?.welcome_text ?? description

  return (
    <div className="menu-theme min-h-screen">
      <div className="menu-page-bg" aria-hidden />

      <header className="menu-header">
        <div className="menu-header__top">
          <div className="menu-header__brand">
            {eyebrow && <p className="menu-eyebrow">{eyebrow}</p>}
            <h1 className="menu-title">{title}</h1>
            {tagline && <p className="menu-tagline">{tagline}</p>}
          </div>
          <LanguageSwitcher />
        </div>

        {welcomeText && <p className="menu-welcome">{welcomeText}</p>}

        <MenuHeroSlider slides={slides} restaurantName={title} />
      </header>

      {showCategoryNav && categories && categories.length > 0 && onCategoryClick && (
        <nav className="menu-category-nav" aria-label={t('common.menuEyebrow')}>
          <div className="menu-category-nav__track">
            {onBackToCategories && (
              <button
                type="button"
                onClick={onBackToCategories}
                className="menu-category-pill menu-category-pill--back"
              >
                ← {t('common.backToCategories')}
              </button>
            )}
            <button
              type="button"
              onClick={() => onCategoryClick(ALL_PRODUCTS_VIEW)}
              className={`menu-category-pill ${
                activeCategoryId === ALL_PRODUCTS_VIEW ? 'menu-category-pill--active' : ''
              }`}
              aria-current={activeCategoryId === ALL_PRODUCTS_VIEW ? 'true' : undefined}
            >
              {t('common.allProducts')}
            </button>
            {categories.map((category) => {
              const isActive = activeCategoryId === category.id

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryClick(category.id)}
                  className={`menu-category-pill ${isActive ? 'menu-category-pill--active' : ''}`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {category.name}
                </button>
              )
            })}
          </div>
        </nav>
      )}

      <main className="menu-main">{children}</main>

      {!hideFooter &&
        (footer === undefined ? (
          <footer className="menu-footer">
            <div className="menu-footer__ornament" aria-hidden>
              <span />
              <span />
            </div>
            <p>{t('common.footerPoweredBy')}</p>
          </footer>
        ) : (
          footer
        ))}
    </div>
  )
}
