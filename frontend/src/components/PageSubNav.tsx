interface PageSubNavItem {
  id: string
  label: string
}

interface PageSubNavProps {
  items: PageSubNavItem[]
  activeId: string
  onChange: (id: string) => void
}

export default function PageSubNav({ items, activeId, onChange }: PageSubNavProps) {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-slate-200"
      aria-label="Alt bölüm"
    >
      {items.map((item) => {
        const isActive = item.id === activeId

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`-mb-px rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'border border-b-white border-slate-200 bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
