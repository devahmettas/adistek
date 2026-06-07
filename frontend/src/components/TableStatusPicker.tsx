import { useEffect, useRef, useState, type MouseEvent } from 'react'
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
}

export default function TableStatusPicker({
  status,
  onChange,
  onClose,
  className = '',
}: TableStatusPickerProps) {
  const menuRef = useRef<HTMLDivElement>(null)

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
      className={`absolute left-0 top-full z-20 mt-1 min-w-[10rem] rounded-xl border border-gray-200 bg-white py-1 shadow-lg ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      {TABLE_STATUSES.map((option) => {
        const styles = TABLE_STATUS_STYLES[option]

        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              onChange(option)
              onClose()
            }}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
              option === status ? 'bg-gray-50 font-semibold' : ''
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
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
  onClick?: (event: MouseEvent) => void
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
                onClick(event as unknown as MouseEvent)
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
