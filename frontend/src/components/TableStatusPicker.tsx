import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import {
  TABLE_STATUS_LABELS,
  TABLE_STATUS_STYLES,
  TABLE_STATUSES,
  type TableStatus,
} from '../constants/tableStatuses'

interface TableStatusPickerProps {
  status: TableStatus
  onChange: (status: TableStatus) => void
  onClose: () => void
  className?: string
  variant?: 'compact' | 'large'
}

const PICKER_VARIANTS = {
  compact: {
    menu: 'min-w-[10rem] rounded-xl border border-slate-200 py-1 shadow-panel',
    item: 'gap-2 px-3 py-2 text-sm',
    dot: 'h-2 w-2',
    active: 'font-semibold',
  },
  large: {
    menu: 'min-w-[14rem] rounded-2xl py-2 shadow-xl sm:min-w-[16rem]',
    item: 'gap-3 px-4 py-3 text-base sm:py-3.5 sm:text-lg',
    dot: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    active: 'font-bold',
  },
} as const

export default function TableStatusPicker({
  status,
  onChange,
  onClose,
  className = '',
  variant = 'compact',
}: TableStatusPickerProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const styles = PICKER_VARIANTS[variant]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className={`absolute left-0 top-full z-20 mt-1 bg-white ${styles.menu} ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      {TABLE_STATUSES.map((option) => {
        const optionStyles = TABLE_STATUS_STYLES[option]

        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              onChange(option)
              onClose()
            }}
            className={`flex w-full items-center text-left hover:bg-slate-50 ${styles.item} ${
              option === status ? `bg-brand-50 ${styles.active}` : ''
            }`}
          >
            <span className={`shrink-0 rounded-full ${styles.dot} ${optionStyles.dot}`} />
            {TABLE_STATUS_LABELS[option]}
          </button>
        )
      })}
    </div>
  )
}

export function TableStatusBadge({
  status,
  onClick,
  className = '',
}: {
  status: TableStatus
  onClick?: (event: ReactMouseEvent) => void
  className?: string
}) {
  const styles = TABLE_STATUS_STYLES[status] ?? TABLE_STATUS_STYLES.empty

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick(event as unknown as ReactMouseEvent)
              }
            }
          : undefined
      }
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles.badge} ${
        onClick ? 'cursor-pointer ring-offset-1 hover:ring-2 hover:ring-gray-300' : ''
      } ${className}`}
      title={onClick ? 'Durumu değiştirmek için tıklayın' : undefined}
    >
      {TABLE_STATUS_LABELS[status]}
    </span>
  )
}
