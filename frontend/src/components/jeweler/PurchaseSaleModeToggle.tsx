export type PurchaseSaleMode = 'purchase' | 'sale'

interface PurchaseSaleModeToggleProps {
  mode: PurchaseSaleMode
  onChange: (mode: PurchaseSaleMode) => void
}

const MODES: Array<{ value: PurchaseSaleMode; label: string; description: string }> = [
  { value: 'purchase', label: 'Alış', description: 'Müşteriden ürün alımı' },
  { value: 'sale', label: 'Satış', description: 'Müşteriye ürün satışı' },
]

export default function PurchaseSaleModeToggle({ mode, onChange }: PurchaseSaleModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="İşlem türü"
      className="inline-flex w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm sm:w-auto"
    >
      {MODES.map((option) => {
        const active = mode === option.value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`flex min-w-0 flex-1 flex-col rounded-xl px-4 py-2.5 text-left transition sm:min-w-[8.5rem] ${
              active
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            <span className={`text-sm font-bold ${active ? 'text-brand-800' : ''}`}>
              {option.label}
            </span>
            <span className="mt-0.5 text-[11px] leading-tight text-slate-500">
              {option.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
