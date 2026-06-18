export const JEWELER_PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Nakit', shortLabel: 'Nakit' },
  { value: 'transfer', label: 'Havale/EFT', shortLabel: 'Havale' },
  { value: 'card', label: 'Kart', shortLabel: 'Kart' },
] as const

export const JEWELER_SALE_PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Nakit', shortLabel: 'Nakit' },
  { value: 'card', label: 'Kart', shortLabel: 'Kart' },
  { value: 'transfer', label: 'Havale/EFT', shortLabel: 'Havale' },
  { value: 'gold_exchange', label: 'Altın Takas', shortLabel: 'Takas' },
] as const

type PaymentOption = {
  value: string
  label: string
  shortLabel: string
}

interface JewelerPaymentMethodPickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
  options?: readonly PaymentOption[]
  compact?: boolean
}

export default function JewelerPaymentMethodPicker({
  value,
  onChange,
  label = 'Ödeme Yöntemi',
  className = '',
  options = JEWELER_PAYMENT_OPTIONS,
  compact = false,
}: JewelerPaymentMethodPickerProps) {
  const gridCols = options.length > 3 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className={`space-y-1.5 ${className}`}>
      <p className="block text-sm font-medium text-slate-700">{label}</p>
      <div
        className={
          compact
            ? `grid ${gridCols} gap-1.5`
            : 'flex gap-1.5 md:gap-2'
        }
      >
        {options.map((option) => {
          const isActive = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={
                compact
                  ? `min-h-[36px] w-full rounded-lg border px-1.5 py-1.5 text-[11px] font-semibold leading-tight transition active:scale-[0.98] sm:text-xs ${
                    isActive
                      ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`
                  : `min-h-[40px] flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition active:scale-[0.98] md:min-h-[44px] md:min-w-[8.5rem] md:flex-none md:px-6 md:py-2.5 md:text-sm ${
                    isActive
                      ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`
              }
            >
              {compact ? option.shortLabel : (
                <>
                  <span className="md:hidden">{option.shortLabel}</span>
                  <span className="hidden md:inline">{option.label}</span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
