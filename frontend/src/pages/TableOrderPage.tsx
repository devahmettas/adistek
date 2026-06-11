import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import PublicPageShell from '../components/PublicPageShell'
import MenuCategoryGrid from '../components/menu/MenuCategoryGrid'
import MenuLoadingScreen from '../components/menu/MenuLoadingScreen'
import MenuProductsPanel from '../components/menu/MenuProductsPanel'
import ProductOrderModal from '../components/menu/ProductOrderModal'
import {
  getTableOrderPage,
  placeGuestOrder,
  type TableOrderPage,
} from '../api/tableOrder'
import type { PublicMenuProduct } from '../api/publicMenu'
import { getMenuLanguage, type MenuLanguage } from '../i18n'
import { formatMenuPrice } from '../utils/formatMenuPrice'
import {
  ALL_PRODUCTS_VIEW,
  countMenuProducts,
  flattenMenuProducts,
  type MenuCategorySelection,
} from '../utils/menuCategoryView'
interface CartItem {
  cartId: string
  productId: number
  name: string
  price: string
  quantity: number
  note: string
}

function normalizeNote(note: string): string {
  return note.trim()
}

function createCartId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function OrderSuccessModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="menu-modal-backdrop menu-modal-backdrop--centered">
      <div className="menu-success-modal">
        <div className="menu-success-modal__icon" aria-hidden>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="menu-success-modal__title">{t('order.successTitle')}</h2>
        <p className="menu-success-modal__text">{t('order.successMessage')}</p>
        <p className="menu-success-modal__note">{t('order.bonAppetit')}</p>

        <button type="button" onClick={onClose} className="menu-btn menu-btn--primary menu-btn--full">
          {t('order.backToMenu')}
        </button>
      </div>
    </div>
  )
}

export default function TableOrderPage() {
  const { t, i18n } = useTranslation()
  const language = (getMenuLanguage() ?? i18n.language) as MenuLanguage
  const { token } = useParams<{ token: string }>()
  const [page, setPage] = useState<TableOrderPage | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [addingProduct, setAddingProduct] = useState<PublicMenuProduct | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false)
  const [selectedView, setSelectedView] = useState<MenuCategorySelection | null>(null)
  const productsRef = useRef<HTMLDivElement | null>(null)

  const loadPage = async (options?: { silent?: boolean }) => {
    if (!token) {
      return
    }

    if (!options?.silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const data = await getTableOrderPage(token, language)
      setPage(data)
      setSessionToken(data.session_token)
      setSelectedView(null)
    } catch {
      if (!options?.silent) {
        setError(t('common.tableNotFound'))
      }
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadPage({ silent: page !== null && language === 'tr' })
  }, [token, language])

  useEffect(() => {
    if (!token || !page || page.can_order) {
      return
    }

    const intervalId = window.setInterval(() => {
      void loadPage({ silent: true })
    }, 10000)

    return () => window.clearInterval(intervalId)
  }, [token, page?.can_order])

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart],
  )

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  )

  const addToCart = (product: PublicMenuProduct, quantity: number, note: string) => {
    const normalizedNote = normalizeNote(note)

    setCart((current) => {
      const existing = current.find(
        (item) => item.productId === product.id && normalizeNote(item.note) === normalizedNote,
      )

      if (existing) {
        return current.map((item) =>
          item.cartId === existing.cartId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }

      return [
        ...current,
        {
          cartId: createCartId(),
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          note: normalizedNote,
        },
      ]
    })

    setAddingProduct(null)
  }

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const updateNote = (cartId: string, note: string) => {
    setCart((current) =>
      current.map((item) => (item.cartId === cartId ? { ...item, note } : item)),
    )
  }

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

  const handleSubmitOrder = async () => {
    if (!token || !sessionToken || cart.length === 0 || submitting) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await placeGuestOrder(
        token,
        sessionToken,
        cart.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          note: normalizeNote(item.note) || null,
        })),
      )
      setCart([])
      setCartOpen(false)
      setOrderSuccessOpen(true)
    } catch {
      setError(t('order.orderError'))
      void loadPage({ silent: true })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <MenuLoadingScreen label={t('common.menuLoading')} />
  }

  if (error && !page) {
    return (
      <div className="menu-theme menu-error-screen">
        <div className="menu-page-bg" aria-hidden />
        <div className="menu-error-card">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!page) {
    return null
  }

  const selectedCategory =
    selectedView !== null && selectedView !== ALL_PRODUCTS_VIEW
      ? page.categories.find((category) => category.id === selectedView)
      : undefined

  const productsToShow =
    selectedView === ALL_PRODUCTS_VIEW
      ? flattenMenuProducts(page.categories)
      : (selectedCategory?.products ?? [])

  const productsTitle =
    selectedView === ALL_PRODUCTS_VIEW
      ? t('common.allProducts')
      : (selectedCategory?.name ?? '')

  return (
    <div className={page.can_order && cartItemCount > 0 ? 'menu-page--with-cart' : undefined}>
      <PublicPageShell
        eyebrow={page.table.name}
        title={page.restaurant.name}
        description={t('order.description')}
        menuSettings={page.menu_settings}
        slides={page.slides}
        categories={page.categories}
        activeCategoryId={selectedView}
        onCategoryClick={switchView}
        showCategoryNav={selectedView !== null}
        onBackToCategories={backToCategories}
        hideFooter
      >
        {!page.can_order && <div className="menu-alert menu-alert--warning">{t('order.inactiveWarning')}</div>}

        {error && <div className="menu-alert menu-alert--error">{error}</div>}

        {page.categories.length === 0 ? (
          <div className="menu-empty-state">
            <p>{t('common.noProducts')}</p>
          </div>
        ) : selectedView === null ? (
          <MenuCategoryGrid
            categories={page.categories}
            totalProductCount={countMenuProducts(page.categories)}
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
            renderProductExtra={(product) => {
              const cartQuantity = cart
                .filter((item) => item.productId === product.id)
                .reduce((sum, item) => sum + item.quantity, 0)

              return {
                onClick: page.can_order ? () => setAddingProduct(product) : undefined,
                action: page.can_order ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setAddingProduct(product)
                    }}
                    className="menu-add-btn menu-add-btn--compact"
                  >
                    {t('order.add')}
                    {cartQuantity > 0 && (
                      <span className="menu-add-btn__badge">{cartQuantity}</span>
                    )}
                  </button>
                ) : undefined,
              }
            }}
          />
        )}
      </PublicPageShell>

      {addingProduct && (
        <ProductOrderModal
          product={addingProduct}
          submitting={false}
          onClose={() => setAddingProduct(null)}
          onConfirm={(quantity, note) => addToCart(addingProduct, quantity, note)}
        />
      )}

      {orderSuccessOpen && (
        <OrderSuccessModal onClose={() => setOrderSuccessOpen(false)} />
      )}

      {page.can_order && cartItemCount > 0 && (
        <>
          <div className="menu-cart-bar">
            <div className="menu-cart-bar__inner">
              <button type="button" onClick={() => setCartOpen(true)} className="menu-cart-bar__summary">
                <span>{t('order.cart', { count: cartItemCount })}</span>
                <span>{formatMenuPrice(cartTotal.toFixed(2), language)}</span>
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="menu-btn menu-btn--primary menu-cart-bar__submit"
              >
                {submitting ? t('order.submitting') : t('order.placeOrder')}
              </button>
            </div>
          </div>

          {cartOpen && (
            <div className="menu-modal-backdrop">
              <div className="menu-cart-drawer">
                <div className="menu-cart-drawer__head">
                  <h2>{t('order.yourCart')}</h2>
                  <button type="button" onClick={() => setCartOpen(false)} className="menu-cart-drawer__close">
                    {t('common.close')}
                  </button>
                </div>

                <ul className="menu-cart-drawer__list">
                  {cart.map((item) => (
                    <li key={item.cartId} className="menu-cart-drawer__item">
                      <div className="menu-cart-drawer__row">
                        <div className="menu-cart-drawer__info">
                          <p>{item.name}</p>
                          <span>{formatMenuPrice(item.price, language)}</span>
                        </div>
                        <div className="menu-qty-control menu-qty-control--compact">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className="menu-qty-control__btn menu-qty-control__btn--ghost"
                          >
                            −
                          </button>
                          <span className="menu-qty-control__value">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className="menu-qty-control__btn menu-qty-control__btn--accent"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={item.note}
                        onChange={(event) => updateNote(item.cartId, event.target.value)}
                        placeholder={t('order.cartNotePlaceholder')}
                        rows={2}
                        maxLength={255}
                        className="menu-input menu-input--compact"
                      />
                    </li>
                  ))}
                </ul>

                <div className="menu-cart-drawer__footer">
                  <div className="menu-cart-drawer__total">
                    <span>{t('common.total')}</span>
                    <strong>{formatMenuPrice(cartTotal.toFixed(2), language)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="menu-btn menu-btn--primary menu-btn--full"
                  >
                    {submitting ? t('order.submittingOrder') : t('order.placeOrder')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
