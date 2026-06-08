import { ReactNode } from 'react'

interface PublicPageShellProps {
  eyebrow?: string
  title: string
  description?: string
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
  categories,
  activeCategoryId,
  onCategoryClick,
  children,
  footer,
  hideFooter = false,
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="relative overflow-hidden border-b border-slate-200 bg-white px-4 pb-8 pt-10 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/80 via-white to-slate-50" />
        <div className="relative mx-auto max-w-3xl text-center">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          )}
        </div>
      </header>

      {categories && categories.length > 0 && onCategoryClick && (
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="mx-auto max-w-3xl overflow-x-auto px-4 py-3 sm:px-6">
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryClick(category.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeCategoryId === category.id
                      ? 'bg-brand-700 text-white shadow-sm'
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
