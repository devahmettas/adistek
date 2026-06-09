import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import LoadingState from '../components/LoadingState'
import PublicPageShell from '../components/PublicPageShell'
import MenuProductCard from '../components/menu/MenuProductCard'
import { getPublicMenu, type PublicMenu, type PublicMenuCategory } from '../api/publicMenu'

function CategorySection({
  category,
  sectionRef,
}: {
  category: PublicMenuCategory
  sectionRef: (element: HTMLElement | null) => void
}) {
  return (
    <section ref={sectionRef} id={`category-${category.id}`} className="scroll-mt-36">
      <div className="mb-5 flex items-center gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{category.name}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent" />
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {category.products.length}
        </span>
      </div>

      <div className="grid gap-4">
        {category.products.map((product, index) => (
          <MenuProductCard key={product.id} product={product} index={index} />
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
    return <LoadingState fullScreen label="Menü yükleniyor..." />
  }

  if (error || !menu) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="panel-surface max-w-sm px-6 py-8 text-center">
          <p className="text-lg font-semibold text-slate-800">{error ?? 'Menü bulunamadı.'}</p>
        </div>
      </div>
    )
  }

  return (
    <PublicPageShell
      eyebrow="Menü"
      title={menu.restaurant.name}
      menuSettings={menu.menu_settings}
      slides={menu.slides}
      categories={menu.categories}
      activeCategoryId={activeCategoryId}
      onCategoryClick={scrollToCategory}
      footer={
        <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
          Afiyet olsun · Adistek
        </footer>
      }
    >
      {menu.categories.length === 0 ? (
        <div className="panel-surface p-8 text-center">
          <p className="text-slate-600">Henüz menüde görüntülenecek ürün yok.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {menu.categories.map((category) => (
            <div key={category.id} data-category-id={category.id} className="menu-section-reveal">
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
    </PublicPageShell>
  )
}
