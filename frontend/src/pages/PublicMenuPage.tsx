import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicMenu, type PublicMenu, type PublicMenuCategory } from '../api/publicMenu'

function formatPrice(price: string): string {
  return `${Number(price).toFixed(2)} ₺`
}

function CategorySection({
  category,
  sectionRef,
}: {
  category: PublicMenuCategory
  sectionRef: (element: HTMLElement | null) => void
}) {
  return (
    <section
      ref={sectionRef}
      id={`category-${category.id}`}
      className="scroll-mt-36"
    >
      <div className="mb-6 flex items-center gap-4">
        <h2 className="font-display text-3xl font-semibold text-stone-900">{category.name}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-amber-300/80 to-transparent" />
      </div>

      <div className="grid gap-4">
        {category.products.map((product) => (
          <article
            key={product.id}
            className="group rounded-2xl border border-stone-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition hover:border-amber-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-semibold text-stone-900">{product.name}</h3>
                {product.description && (
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{product.description}</p>
                )}
              </div>
              <p className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-900">
                {formatPrice(product.price)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function PublicMenuPage() {
  const { identifier } = useParams<{ identifier: string }>()
  const [menu, setMenu] = useState<PublicMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({})

  useEffect(() => {
    if (!identifier) {
      return
    }

    setLoading(true)
    setError(null)

    getPublicMenu(identifier)
      .then((data) => {
        setMenu(data)
        setActiveCategoryId(data.categories[0]?.id ?? null)
      })
      .catch(() => {
        setError('Menü bulunamadı.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [identifier])

  useEffect(() => {
    if (!menu || menu.categories.length === 0) {
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

    menu.categories.forEach((category) => {
      const element = sectionRefs.current[category.id]
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [menu])

  const scrollToCategory = (categoryId: number) => {
    sectionRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveCategoryId(categoryId)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f2ea]">
        <p className="text-sm text-stone-500">Menü yükleniyor...</p>
      </div>
    )
  }

  if (error || !menu) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f2ea] px-4">
        <div className="rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-stone-800">{error ?? 'Menü bulunamadı.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f2ea] text-stone-900">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:wght@500;600;700&display=swap"
      />

      <header className="relative overflow-hidden border-b border-amber-100 bg-[#fffaf3] px-4 pb-10 pt-12 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_45%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700/80">Menü</p>
          <h1 className="font-display mt-3 text-4xl font-bold text-stone-900 sm:text-5xl">
            {menu.restaurant.name}
          </h1>
          <p className="mt-3 text-sm text-stone-600">
            Kategorilere göz atın, ürünleri inceleyin.
          </p>
        </div>
      </header>

      {menu.categories.length > 0 && (
        <div className="sticky top-0 z-20 border-b border-amber-100/80 bg-[#fffaf3]/95 backdrop-blur-md">
          <div className="mx-auto max-w-3xl overflow-x-auto px-4 py-3 sm:px-6">
            <div className="flex gap-2">
              {menu.categories.map((category) => (
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

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {menu.categories.length === 0 ? (
          <div className="rounded-2xl bg-white/80 p-8 text-center shadow-sm">
            <p className="text-stone-600">Henüz menüde görüntülenecek ürün yok.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {menu.categories.map((category) => (
              <div key={category.id} data-category-id={category.id}>
                <CategorySection
                  category={category}
                  sectionRef={(element) => {
                    sectionRefs.current[category.id] = element
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-amber-100 bg-[#fffaf3] px-4 py-6 text-center text-xs text-stone-500">
        Afiyet olsun
      </footer>

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
