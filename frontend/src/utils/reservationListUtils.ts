import type { TableReservation } from '../api/reservations'

export type TimePeriodFilter = 'all' | 'morning' | 'afternoon' | 'evening'

export interface ReservationListFilters {
  search: string
  tableId: string
  timePeriod: TimePeriodFilter
}

export const defaultReservationListFilters: ReservationListFilters = {
  search: '',
  tableId: 'all',
  timePeriod: 'all',
}

export function parseReservationDateTime(reservedAt: string): { date: string; time: string } {
  const parsed = new Date(reservedAt)

  return {
    date: `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`,
    time: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`,
  }
}

function matchesTimePeriod(reservedTime: string, timePeriod: TimePeriodFilter): boolean {
  if (timePeriod === 'all') {
    return true
  }

  const hour = Number.parseInt(reservedTime.split(':')[0] ?? '0', 10)

  if (timePeriod === 'morning') {
    return hour < 12
  }

  if (timePeriod === 'afternoon') {
    return hour >= 12 && hour < 17
  }

  return hour >= 17
}

export function filterReservations(
  reservations: TableReservation[],
  filters: ReservationListFilters,
): TableReservation[] {
  const search = filters.search.trim().toLowerCase()

  return reservations.filter((reservation) => {
    if (filters.tableId !== 'all' && String(reservation.restaurant_table_id) !== filters.tableId) {
      return false
    }

    if (search) {
      const haystack = `${reservation.customer_name} ${reservation.phone} ${reservation.table_name ?? ''}`.toLowerCase()

      if (!haystack.includes(search)) {
        return false
      }
    }

    return matchesTimePeriod(reservation.reserved_time, filters.timePeriod)
  })
}

export function getReservationListStats(reservations: TableReservation[]) {
  const tableIds = new Set(reservations.map((reservation) => reservation.restaurant_table_id))
  const guestCount = reservations.reduce((sum, reservation) => sum + reservation.guest_count, 0)

  return {
    reservationCount: reservations.length,
    tableCount: tableIds.size,
    guestCount,
  }
}
