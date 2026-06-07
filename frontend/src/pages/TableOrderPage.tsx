import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getTableOrderPage,
  placeGuestOrder,
  type TableOrderPage,
} from '../api/tableOrder'
import type { PublicMenuCategory, PublicMenuProduct } from '../api/publicMenu'

interface CartItem {
  productId: number
  name: string
  price: string
  quantity: number
}

function formatPrice(price: string): string {
  return `${Number(price).toFixed(2)} ₺`
}

function ProductCard({
  product,
  cartQuantity,
  canOrder,
  onAdd,
}: {
  product: PublicMenuProduct
  cartQuantity: number
  canOrder: boolean
  onAdd: () => void
}) {
  return (
    <article className="rounded-2xl border border-stone-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-stone-900">{product.name}</h3>
          {product.description && (
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{product.description}</p>
          )}
          <p className="mt-2 text-sm font-bold text-amber-900">{formatPrice(product.price)}</p>
        </div>

        {canOrder && (
          <button
            type="button"
            onClick={onAdd}
            className="relative shrink-0 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 active:scale-95"
          >
            Ekle
            {cartQuantity > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white">
                {cartQuantity}
              </span>
            )}
          </button>
        )}
      </div>
    </article>
  )
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
  return (
    <section ref={sectionRef} id={`category-${category.id}`} className="scroll-mt-36">
      <div className="mb-4 flex items-center gap-4">
        <h2 className="font-display text-2xl font-semibold text-stone-900">{category.name}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-amber-300/80 to-transparent" />
      </div>

      <div className="grid gap-3">
        {category.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            cartQuantity={cart.find((item) => item.productId === product.id)?.quantity ?? 0}
            canOrder={canOrder}
            onAdd={() => onAdd(product)}
          />
        ))}
      </div>
    </section>
  )
}

export default function TableOrderPage() {
  const { token } = useParams<{ token: string }>()
  const [page, setPage] = useState<TableOrderPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({})

  useEffect(() => {
    if (!token) {
      return
    }

    setLoading(true)
    setError(null)

    getTableOrderPage(token)
      .then((data) => {
        setPage(data)
        setActiveCategoryId(data.categories[0]?.id ?? null)
      })
      .catch(() => {
        setError('Masa veya menü bulunamadı.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

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
    () =>
      cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart],
  )

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  )

  const addToCart = (product: PublicMenuProduct) => {
    setOrderSuccess(null)
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]
    })
  }

  const updateQuantity = (productId: number, delta: number) => {
    setOrderSuccess(null)
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const scrollToCategory = (categoryId: number) => {
    sectionRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveCategoryId(categoryId)
  }

  const handleSubmitOrder = async () => {
    if (!token || cart.length === 0 || submitting) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await placeGuestOrder(
        token,
        cart.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      )
      setCart([])
      setCartOpen(false)
      setOrderSuccess(result.message)
    } catch {
      setError('Sipariş gönderilemedi. Lütfen tekrar deneyin.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f2ea]">
        <p className="text-sm text-stone-500">Menü yükleniyor...</p>
      </div>
    )
  }

  if (error && !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f2ea] px-4">
        <div className="rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-stone-800">{error}</p>
        </div>
      </div>
    )
  }

  if (!page) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f7f2ea] pb-28 text-stone-900">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:wght@500;600;700&display=swap"
      />

      <header className="relative overflow-hidden border-b border-amber-100 bg-[#fffaf3] px-4 pb-8 pt-10 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_45%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700/80">
            {page.table.name}
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-stone-900 sm:text-4xl">
            {page.restaurant.name}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Menüden seçin, sepete ekleyin ve siparişinizi mutfağa gönderin.
          </p>
        </div>
      </header>

      {orderSuccess && (
        <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {orderSuccess}
          </div>
        </div>
      )}

      {!page.can_order && (
        <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Bu masa rezerve edilmiş. Sipariş vermek için garsonunuzdan yardım isteyebilirsiniz.
          </div>
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {page.categories.length > 0 && (
        <div className="sticky top-0 z-20 border-b border-amber-100/80 bg-[#fffaf3]/95 backdrop-blur-md">
          <div className="mx-auto max-w-3xl overflow-x-auto px-4 py-3 sm:px-6">
            <div className="flex gap-2">
              {page.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => scrollToCategory(category.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeCategoryId === category.id
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-amber-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {page.categories.length === 0 ? (
          <div className="rounded-2xl bg-white/80 p-8 text-center shadow-sm">
            <p className="text-stone-600">Henüz menüde görüntülenecek ürün yok.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {page.categories.map((category) => (
              <div key={category.id} data-category-id={category.id}>
                <CategorySection
                  category={category}
                  cart={cart}
                  canOrder={page.can_order}
                  onAdd={addToCart}
                  sectionRef={(element) => {
                    sectionRefs.current[category.id] = element
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {page.can_order && cartItemCount > 0 && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-100 bg-[#fffaf3]/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="flex min-w-0 flex-1 items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-stone-200"
              >
                <span className="text-sm font-medium text-stone-700">
                  Sepet ({cartItemCount} ürün)
                </span>
                <span className="text-sm font-bold text-stone-900">
                  {formatPrice(cartTotal.toFixed(2))}
                </span>
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="shrink-0 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
              >
                {submitting ? 'Gönderiliyor...' : 'Sipariş Ver'}
              </button>
            </div>
          </div>

          {cartOpen && (
            <div className="fixed inset-0 z-40 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4">
              <div className="max-h-[80vh] w-full overflow-hidden rounded-t-3xl bg-white sm:max-w-lg sm:rounded-3xl">
                <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                  <h2 className="font-display text-xl font-semibold text-stone-900">Sepetiniz</h2>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="rounded-lg px-3 py-1 text-sm text-stone-500 hover:bg-stone-50"
                  >
                    Kapat
                  </button>
                </div>

                <ul className="max-h-[50vh] divide-y divide-stone-100 overflow-y-auto px-5">
                  {cart.map((item) => (
                    <li key={item.productId} className="flex items-center justify-between gap-3 py-4">
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900">{item.name}</p>
                        <p className="text-sm text-stone-500">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-700"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-stone-100 px-5 py-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-stone-600">Toplam</span>
                    <span className="text-lg font-bold text-stone-900">
                      {formatPrice(cartTotal.toFixed(2))}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="w-full rounded-2xl bg-stone-900 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
                  >
                    {submitting ? 'Sipariş gönderiliyor...' : 'Sipariş Ver'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .font-display {
          font-family: 'Playfair Display', Georgia, serif;
        }
        body {
          font-family: 'DM Sans', system-ui, sans-serif;
        }
      `}</style>
    </div>
  )
}
