import { ReactNode } from 'react'
import type { PublicMenuSettings, PublicMenuSlide } from '../api/publicMenu'
import MenuHeroSlider from './menu/MenuHeroSlider'

interface PublicPageShellProps {
  eyebrow?: string
  title: string
  description?: string
  menuSettings?: PublicMenuSettings
  slides?: PublicMenuSlide[]
  categories?: { id: number; name: string }[]
  activeCategoryId?: number | null
  onCategoryClick?: (categoryId: number) => void
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
  children,
  footer,
  hideFooter = false,
}: PublicPageShellProps) {
  const tagline = menuSettings?.tagline
  const welcomeText = menuSettings?.welcome_text ?? description

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <header className="relative overflow-hidden border-b border-slate-200/80 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.04),transparent_40%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-6 pt-6 sm:px-6 sm:pt-8">
          <div className="mb-5">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            {tagline && (
              <p className="mt-2 text-sm font-medium text-brand-700">{tagline}</p>
            )}
            {welcomeText && (
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
                {welcomeText}
              </p>
            )}
          </div>

          <MenuHeroSlider slides={slides} restaurantName={title} />
        </div>
      </header>

      {categories && categories.length > 0 && onCategoryClick && (
        <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
          <div className="mx-auto max-w-3xl overflow-x-auto px-4 py-3 sm:px-6">
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryClick(category.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeCategoryId === category.id
                      ? 'bg-brand-700 text-white shadow-md shadow-brand-700/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-800'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      {!hideFooter &&
        (footer === undefined ? (
          <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
            Adistek ile sunulmaktadır
          </footer>
        ) : (
          footer
        ))}
    </div>
  )
}
