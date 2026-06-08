import type { TableTodayReservation } from '../api/types'
import { TABLE_STATUS_STYLES } from '../constants/tableStatuses'

interface TableTodayReservationHintProps {
  reservations: TableTodayReservation[]
}

export default function TableTodayReservationHint({ reservations }: TableTodayReservationHintProps) {
  if (reservations.length === 0) {
    return null
  }

  const reservedStyles = TABLE_STATUS_STYLES.reserved

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1">
      {reservations.map((reservation) => (
        <span
          key={reservation.id}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight sm:text-xs ${reservedStyles.badge}`}
          title={`${reservation.customer_name} · ${reservation.guest_count} kişi`}
        >
          <span>Rezerve</span>
          <span className="opacity-80">{reservation.reserved_time}</span>
        </span>
      ))}
    </span>
  )
}
