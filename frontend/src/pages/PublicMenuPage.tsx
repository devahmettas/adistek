import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import PublicPageShell from '../components/PublicPageShell'
import MenuCategoryGrid from '../components/menu/MenuCategoryGrid'
import MenuLoadingScreen from '../components/menu/MenuLoadingScreen'
import MenuProductsPanel from '../components/menu/MenuProductsPanel'
import { getPublicMenu, type PublicMenu } from '../api/publicMenu'
import { getMenuLanguage, type MenuLanguage } from '../i18n'
import {
  ALL_PRODUCTS_VIEW,
  countMenuProducts,
  flattenMenuProducts,
  type MenuCategorySelection,
} from '../utils/menuCategoryView'

export default function PublicMenuPage() {
  const { t, i18n } = useTranslation()
  const language = (getMenuLanguage() ?? i18n.language) as MenuLanguage
  const { identifier } = useParams<{ identifier: string }>()
  const [menu, setMenu] = useState<PublicMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<MenuCategorySelection | null>(null)
  const productsRef = useRef<HTMLDivElement | null>(null)
  const hasMenuRef = useRef(false)

  useEffect(() => {
    if (!identifier) {
      return
    }

    const showLoadingOverlay = !hasMenuRef.current || language !== 'tr'

    if (showLoadingOverlay) {
      setLoading(true)
    }

    setError(null)

    getPublicMenu(identifier, language)
      .then((data) => {
        hasMenuRef.current = true
        setMenu(data)
        setSelectedView(null)
      })
      .catch(() => {
        setError(t('common.menuNotFound'))
      })
      .finally(() => {
        if (showLoadingOverlay) {
          setLoading(false)
        }
      })
  }, [identifier, language, t])

  const scrollToProducts = () => {
    requestAnimationFrame(() => {
      productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const openView = (view: MenuCategorySelection) => {
    setSelectedView(view)
    scrollToProducts()
  }

  const switchView = (view: MenuCategorySelection) => {
    setSelectedView(view)
    requestAnimationFrame(() => {
      productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const backToCategories = () => {
    setSelectedView(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return <MenuLoadingScreen label={t('common.menuLoading')} />
  }

  if (error || !menu) {
    return (
      <div className="menu-theme menu-error-screen">
        <div className="menu-page-bg" aria-hidden />
        <div className="menu-error-card">
          <p>{error ?? t('common.menuNotFound')}</p>
        </div>
      </div>
    )
  }

  const selectedCategory =
    selectedView !== null && selectedView !== ALL_PRODUCTS_VIEW
      ? menu.categories.find((category) => category.id === selectedView)
      : undefined

  const productsToShow =
    selectedView === ALL_PRODUCTS_VIEW
      ? flattenMenuProducts(menu.categories)
      : (selectedCategory?.products ?? [])

  const productsTitle =
    selectedView === ALL_PRODUCTS_VIEW
      ? t('common.allProducts')
      : (selectedCategory?.name ?? '')

  return (
    <PublicPageShell
      eyebrow={t('common.menuEyebrow')}
      title={menu.restaurant.name}
      menuSettings={menu.menu_settings}
      slides={menu.slides}
      categories={menu.categories}
      activeCategoryId={selectedView}
      onCategoryClick={switchView}
      showCategoryNav={selectedView !== null}
      onBackToCategories={backToCategories}
      footer={
        <footer className="menu-footer">
          <div className="menu-footer__ornament" aria-hidden>
            <span />
            <span />
          </div>
          <p>{t('common.footerBonAppetit')}</p>
        </footer>
      }
    >
      {menu.categories.length === 0 ? (
        <div className="menu-empty-state">
          <p>{t('common.noProducts')}</p>
        </div>
      ) : selectedView === null ? (
        <MenuCategoryGrid
          categories={menu.categories}
          totalProductCount={countMenuProducts(menu.categories)}
          onSelectAll={() => openView(ALL_PRODUCTS_VIEW)}
          onSelect={(categoryId) => openView(categoryId)}
        />
      ) : (
        <MenuProductsPanel
          title={productsTitle}
          products={productsToShow}
          panelRef={(element) => {
            productsRef.current = element
          }}
        />
      )}
    </PublicPageShell>
  )
}
