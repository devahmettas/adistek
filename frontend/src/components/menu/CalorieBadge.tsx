import { useTranslation } from 'react-i18next'

interface CalorieBadgeProps {
  calories: number
  compact?: boolean
}

export default function CalorieBadge({ calories, compact = false }: CalorieBadgeProps) {
  const { t } = useTranslation()
  const unit = t('common.kcal')

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 font-semibold text-orange-700 ${
        compact ? 'text-[11px]' : 'text-xs'
      }`}
      title={`${calories} ${unit}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
        <path
          d="M12 3c2 4 4 6 4 9a4 4 0 01-8 0c0-3 2-5 4-9z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        {calories} {unit}
      </span>
    </span>
  )
}
