import { useMemo } from 'react'
import type { TableReservation } from '../../api/reservations'
import { TABLE_STATUS_STYLES } from '../../constants/tableStatuses'
import {
  buildReservationTimeSlots,
  DEFAULT_OPERATING_HOURS,
  formatSlotRange,
  type ReservationOperatingHours,
  type ReservationTimeSlot,
} from '../../utils/reservationSlotUtils'

interface ReservationTimeSlotGridProps {
  slots?: ReservationTimeSlot[]
  date?: string
  reservations?: TableReservation[]
  durationMinutes: number
  operatingHours?: ReservationOperatingHours
  selectedTime: string | null
  onSelectTime: (time: string) => void
  compact?: boolean
}

function getSlotStyles(slot: ReservationTimeSlot, isSelected: boolean) {
  if (slot.status === 'reserved') {
    return TABLE_STATUS_STYLES.reserved
  }

  if (slot.status === 'past') {
    return {
      card: 'border-slate-200 bg-slate-100 opacity-60',
      badge: 'bg-slate-200 text-slate-500',
      dot: 'bg-slate-400',
    }
  }

  if (isSelected) {
    return {
      card: 'border-brand-600 bg-brand-50 ring-2 ring-brand-200',
      badge: 'bg-brand-700 text-white',
      dot: 'bg-brand-600',
    }
  }

  return TABLE_STATUS_STYLES.empty
}

function getSlotLabel(slot: ReservationTimeSlot): string {
  if (slot.status === 'reserved') {
    return 'Rezerve'
  }

  if (slot.status === 'past') {
    return 'Geçti'
  }

  return 'Müsait'
}

export default function ReservationTimeSlotGrid({
  slots: providedSlots,
  date,
  reservations,
  durationMinutes,
  operatingHours = DEFAULT_OPERATING_HOURS,
  selectedTime,
  onSelectTime,
  compact = false,
}: ReservationTimeSlotGridProps) {
  const slots = useMemo(() => {
    if (providedSlots) {
      return providedSlots
    }

    return buildReservationTimeSlots(date ?? '', reservations ?? [], durationMinutes, operatingHours)
  }, [providedSlots, date, reservations, durationMinutes, operatingHours])

  if (slots.length === 0) {
    return <p className="text-sm text-slate-500">Saat aralığı oluşturulamadı.</p>
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <p className="text-sm text-slate-500">
          Rezervasyon yapmak için müsait saate tıklayın. Her aralık {durationMinutes} dakikadır.
        </p>
      )}
      <div
        className={`grid gap-3 ${
          compact
            ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
        }`}
      >
        {slots.map((slot) => {
          const isSelected = selectedTime === slot.time
          const styles = getSlotStyles(slot, isSelected)
          const disabled = slot.status !== 'available'

          return (
            <button
              key={slot.time}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTime(slot.time)}
              className={`flex ${compact ? 'min-h-[5rem]' : 'min-h-[6.5rem]'} flex-col justify-between rounded-2xl border-2 p-3 text-left shadow-card transition ${
                disabled ? 'cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-panel'
              } ${styles.card}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-bold text-slate-900">{slot.label}</p>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs ${styles.badge}`}>
                  {getSlotLabel(slot)}
                </span>
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs font-semibold text-slate-700">{formatSlotRange(slot.time, durationMinutes)}</p>
                {slot.reservation && (
                  <p className="truncate text-[10px] text-slate-600 sm:text-xs">
                    {slot.reservation.customer_name} · {slot.reservation.guest_count} kişi
                  </p>
                )}
                {!slot.reservation && slot.availableTableCount !== undefined && slot.status === 'available' && (
                  <p className="text-[10px] font-semibold text-emerald-700 sm:text-xs">
                    {slot.availableTableCount} masa müsait
                  </p>
                )}
                {!slot.reservation && slot.status === 'reserved' && slot.availableTableCount === 0 && (
                  <p className="text-[10px] text-slate-600 sm:text-xs">Tüm masalar dolu</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
