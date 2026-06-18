interface SaleBarcodeScanButtonProps {
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'toolbar'
}

function ScanIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h10" />
    </svg>
  )
}

export default function SaleBarcodeScanButton({
  onClick,
  disabled = false,
  variant = 'default',
}: SaleBarcodeScanButtonProps) {
  if (variant === 'toolbar') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label="Barkod okut"
        className="inline-flex h-[42px] w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white px-3 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-brand-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:min-w-[9.5rem]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
          <ScanIcon className="h-4 w-4" />
        </span>
        <span className="whitespace-nowrap">Barkod Okut</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Barkod okut"
      className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-white to-amber-50/80 px-5 py-3 text-sm font-semibold text-brand-900 shadow-sm transition hover:border-brand-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[11rem]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm transition group-hover:bg-brand-800">
        <ScanIcon />
      </span>
      <span className="text-left leading-tight">
        <span className="block">Barkod Okut</span>
        <span className="block text-[11px] font-medium text-brand-700/80">Ürünü satışa ekle</span>
      </span>
    </button>
  )
}
