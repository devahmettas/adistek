import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getTableOrderPage,
  placeGuestOrder,
  type TableOrderPage,
} from '../api/tableOrder'
import type { PublicMenuCategory, PublicMenuProduct } from '../api/publicMenu'

interface CartItem {
  cartId: string
  productId: number
  name: string
  price: string
  quantity: number
  note: string
}

function formatPrice(price: string): string {
  return `${Number(price).toFixed(2)} ₺`
}

function normalizeNote(note: string): string {
  return note.trim()
}

function createCartId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
            cartQuantity={cart
              .filter((item) => item.productId === product.id)
              .reduce((sum, item) => sum + item.quantity, 0)}
            canOrder={canOrder}
            onAdd={() => onAdd(product)}
          />
        ))}
      </div>
    </section>
  )
}

function AddProductModal({
  product,
  submitting,
  onClose,
  onConfirm,
}: {
  product: PublicMenuProduct
  submitting: boolean
  onClose: () => void
  onConfirm: (quantity: number, note: string) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4">
      <div className="w-full rounded-t-3xl bg-white sm:max-w-md sm:rounded-3xl">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-stone-900">{product.name}</h2>
          <p className="mt-1 text-sm text-stone-500">{formatPrice(product.price)}</p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label htmlFor="add-quantity" className="mb-2 block text-sm font-medium text-stone-700">
              Adet
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-700"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="add-note" className="mb-2 block text-sm font-medium text-stone-700">
              Sipariş notu <span className="font-normal text-stone-400">(isteğe bağlı)</span>
            </label>
            <textarea
              id="add-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Örn: Az pişmiş, sos ayrı, buzlu olmasın..."
              rows={3}
              maxLength={255}
              className="w-full resize-none rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none ring-amber-200 focus:border-amber-300 focus:ring-2"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-2xl border border-stone-200 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => onConfirm(quantity, note)}
            disabled={submitting}
            className="flex-1 rounded-2xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
          >
            Sepete Ekle
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderSuccessModal({ onClose }: { onClose: () => void }) {
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

        <h2 className="font-display mt-5 text-2xl font-bold text-stone-900">
          Siparişiniz alındı!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Ürünleriniz hazırlanıyor. Kısa süre içinde masanıza getirilecektir.
        </p>
        <p className="mt-2 text-xs text-stone-400">Afiyet olsun</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-stone-900 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
        >
          Menüye Dön
        </button>
      </div>
    </div>
  )
}

export default function TableOrderPage() {
  const { token } = useParams<{ token: string }>()
  const [page, setPage] = useState<TableOrderPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [addingProduct, setAddingProduct] = useState<PublicMenuProduct | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false)
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
    if (!token || cart.length === 0 || submitting) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await placeGuestOrder(
        token,
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
            Menüden seçin, not ekleyin ve siparişinizi mutfağa gönderin.
          </p>
        </div>
      </header>

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
                  onAdd={setAddingProduct}
                  sectionRef={(element) => {
                    sectionRefs.current[category.id] = element
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {addingProduct && (
        <AddProductModal
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
                    <li key={item.cartId} className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-stone-900">{item.name}</p>
                          <p className="text-sm text-stone-500">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-700"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={item.note}
                        onChange={(event) => updateNote(item.cartId, event.target.value)}
                        placeholder="Sipariş notu ekle..."
                        rows={2}
                        maxLength={255}
                        className="mt-3 w-full resize-none rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-700 outline-none ring-amber-200 focus:border-amber-300 focus:ring-2"
                      />
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
