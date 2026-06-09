import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import LoadingState from '../components/LoadingState'
import PublicPageShell from '../components/PublicPageShell'
import MenuProductCard from '../components/menu/MenuProductCard'
import ProductOrderModal from '../components/menu/ProductOrderModal'
import {
  getTableOrderPage,
  placeGuestOrder,
  type TableOrderPage,
} from '../api/tableOrder'
import type { PublicMenuCategory, PublicMenuProduct } from '../api/publicMenu'
import { getMenuLanguage, type MenuLanguage } from '../i18n'
import { formatMenuPrice } from '../utils/formatMenuPrice'
import { resolveMenuAssetUrl } from '../utils/menuAssetUrl'

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

function CategorySection({
  category,
  cart,
  canOrder,
  onAdd,
  sectionRef,
}: {
  category: PublicMenuCategory
  cart: CartItem[]
  canOrder: boolean
  onAdd: (product: PublicMenuProduct) => void
  sectionRef: (element: HTMLElement | null) => void
}) {
  const { t } = useTranslation()
  const categoryImageUrl = resolveMenuAssetUrl(category.image_url, category.image_path)

  return (
    <section ref={sectionRef} id={`category-${category.id}`} className="scroll-mt-36">
      <div className="mb-4 flex items-center gap-4">
        {categoryImageUrl && (
          <img
            src={categoryImageUrl}
            alt={category.name}
            className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover shadow-sm"
          />
        )}
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{category.name}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent" />
      </div>

      <div className="grid gap-4">
        {category.products.map((product, index) => {
          const cartQuantity = cart
            .filter((item) => item.productId === product.id)
            .reduce((sum, item) => sum + item.quantity, 0)

          return (
            <MenuProductCard
              key={product.id}
              product={product}
              index={index}
              onClick={canOrder ? () => onAdd(product) : undefined}
              action={
                canOrder ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onAdd(product)
                    }}
                    className="relative rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 active:scale-95"
                  >
                    {t('order.add')}
                    {cartQuantity > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white">
                        {cartQuantity}
                      </span>
                    )}
                  </button>
                ) : undefined
              }
            />
          )
        })}
      </div>
    </section>
  )
}

function OrderSuccessModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-8 w-8 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-900">{t('order.successTitle')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{t('order.successMessage')}</p>
        <p className="mt-2 text-xs text-slate-400">{t('order.bonAppetit')}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-brand-700 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
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
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({})

  const loadPage = async (options?: { silent?: boolean }) => {
    if (!token) {
      return
    }

    if (!options?.silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const data = await getTableOrderPage(token)
      setPage(data)
      setSessionToken(data.session_token)
      setActiveCategoryId((current) => current ?? data.categories[0]?.id ?? null)
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
    void loadPage()
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

  useEffect(() => {
    if (!page || page.categories.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible) {
          const id = Number(visible.target.getAttribute('data-category-id'))
          if (!Number.isNaN(id)) {
            setActiveCategoryId(id)
          }
        }
      },
      { rootMargin: '-40% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    )

    page.categories.forEach((category) => {
      const element = sectionRefs.current[category.id]
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [page])

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

  const scrollToCategory = (categoryId: number) => {
    sectionRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveCategoryId(categoryId)
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
    return <LoadingState fullScreen label={t('common.menuLoading')} />
  }

  if (error && !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="panel-surface max-w-sm px-6 py-8 text-center">
          <p className="text-lg font-semibold text-slate-800">{error}</p>
        </div>
      </div>
    )
  }

  if (!page) {
    return null
  }

  return (
    <div className={`min-h-screen bg-[#f7f8fb] text-slate-900 ${page.can_order && cartItemCount > 0 ? 'pb-28' : ''}`}>
      <PublicPageShell
        eyebrow={page.table.name}
        title={page.restaurant.name}
        description={t('order.description')}
        menuSettings={page.menu_settings}
        slides={page.slides}
        categories={page.categories}
        activeCategoryId={activeCategoryId}
        onCategoryClick={scrollToCategory}
        hideFooter
      >
        {!page.can_order && (
          <div className="alert-warning mb-6">
            {t('order.inactiveWarning')}
          </div>
        )}

        {error && <div className="alert-error mb-6">{error}</div>}

        {page.categories.length === 0 ? (
          <div className="panel-surface p-8 text-center">
            <p className="text-slate-600">{t('common.noProducts')}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {page.categories.map((category) => (
              <div key={category.id} data-category-id={category.id} className="menu-section-reveal">
                <CategorySection
                  category={category}
                  cart={cart}
                  canOrder={page.can_order}
                  onAdd={setAddingProduct}
                  sectionRef={(element) => {
                    sectionRefs.current[category.id] = element
                  }}
                />
              </div>
            ))}
          </div>
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
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="flex min-w-0 flex-1 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-700">
                  {t('order.cart', { count: cartItemCount })}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {formatMenuPrice(cartTotal.toFixed(2), language)}
                </span>
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="shrink-0 rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
              >
                {submitting ? t('order.submitting') : t('order.placeOrder')}
              </button>
            </div>
          </div>

          {cartOpen && (
            <div className="fixed inset-0 z-40 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4">
              <div className="max-h-[80vh] w-full overflow-hidden rounded-t-3xl bg-white sm:max-w-lg sm:rounded-3xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="text-xl font-semibold text-slate-900">{t('order.yourCart')}</h2>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-50"
                  >
                    {t('common.close')}
                  </button>
                </div>

                <ul className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto px-5">
                  {cart.map((item) => (
                    <li key={item.cartId} className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-500">
                            {formatMenuPrice(item.price, language)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-white"
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
                        className="input-field mt-3 resize-none text-xs"
                      />
                    </li>
                  ))}
                </ul>

                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-slate-600">{t('common.total')}</span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatMenuPrice(cartTotal.toFixed(2), language)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="w-full rounded-2xl bg-brand-700 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
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
