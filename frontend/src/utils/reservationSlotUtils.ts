import type { TableReservation } from '../api/reservations'
import { todayLocalString } from './dateHelpers'

export const RESERVATION_DAY_START_HOUR = 10
export const RESERVATION_DAY_END_HOUR = 23

export interface ReservationTimeSlot {
  time: string
  label: string
  status: 'available' | 'reserved' | 'past'
  reservation?: TableReservation
  availableTableCount?: number
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

function toTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function generateReservationSlotTimes(durationMinutes: number): string[] {
  const slots: string[] = []
  const startMinutes = RESERVATION_DAY_START_HOUR * 60
  const endMinutes = RESERVATION_DAY_END_HOUR * 60

  for (let current = startMinutes; current + durationMinutes <= endMinutes; current += durationMinutes) {
    slots.push(toTimeString(current))
  }

  return slots
}

function getReservationWindow(reservation: TableReservation, durationMinutes: number) {
  const start = new Date(reservation.reserved_at).getTime()
  const end = start + durationMinutes * 60_000

  return { start, end }
}

export function findReservationForSlot(
  date: string,
  slotTime: string,
  reservations: TableReservation[],
  durationMinutes: number,
): TableReservation | undefined {
  const slotStart = new Date(`${date}T${slotTime}:00`).getTime()
  const slotEnd = slotStart + durationMinutes * 60_000

  return reservations.find((reservation) => {
    const { start, end } = getReservationWindow(reservation, durationMinutes)

    return slotStart < end && slotEnd > start
  })
}

export function isSlotInPast(date: string, slotTime: string): boolean {
  if (date !== todayLocalString()) {
    return false
  }

  return new Date(`${date}T${slotTime}:00`).getTime() <= Date.now()
}

export function buildReservationTimeSlots(
  date: string,
  reservations: TableReservation[],
  durationMinutes: number,
): ReservationTimeSlot[] {
  return generateReservationSlotTimes(durationMinutes).map((time) => {
    const reservation = findReservationForSlot(date, time, reservations, durationMinutes)
    const past = isSlotInPast(date, time)

    if (reservation) {
      return {
        time,
        label: time,
        status: 'reserved',
        reservation,
      }
    }

    if (past) {
      return {
        time,
        label: time,
        status: 'past',
      }
    }

    return {
      time,
      label: time,
      status: 'available',
    }
  })
}

export function formatSlotRange(time: string, durationMinutes: number): string {
  const endMinutes = toMinutes(time) + durationMinutes

  return `${time} – ${toTimeString(endMinutes)}`
}

export function isTableFreeAtSlot(
  date: string,
  slotTime: string,
  reservations: TableReservation[],
  durationMinutes: number,
): boolean {
  return !findReservationForSlot(date, slotTime, reservations, durationMinutes)
}

export function isTableFreeForDay(reservations: TableReservation[]): boolean {
  return reservations.length === 0
}

export function buildPageReservationTimeSlots(
  date: string,
  tables: { reservations: TableReservation[] }[],
  durationMinutes: number,
): ReservationTimeSlot[] {
  return generateReservationSlotTimes(durationMinutes).map((time) => {
    const past = isSlotInPast(date, time)
    const availableTableCount = tables.filter((table) =>
      isTableFreeAtSlot(date, time, table.reservations, durationMinutes),
    ).length

    if (past) {
      return {
        time,
        label: time,
        status: 'past',
        availableTableCount: 0,
      }
    }

    if (availableTableCount === 0) {
      return {
        time,
        label: time,
        status: 'reserved',
        availableTableCount: 0,
      }
    }

    return {
      time,
      label: time,
      status: 'available',
      availableTableCount,
    }
  })
}

export interface ReservationTableViewState {
  displayStatus: 'empty' | 'reserved'
  statusLabel: string
  clickable: boolean
  highlightTime?: string
}

export function getReservationTableViewState(
  table: { reservations: TableReservation[] },
  date: string,
  selectedTime: string | null,
  durationMinutes: number,
): ReservationTableViewState {
  if (selectedTime) {
    const reservation = findReservationForSlot(date, selectedTime, table.reservations, durationMinutes)

    if (reservation) {
      return {
        displayStatus: 'reserved',
        statusLabel: 'Rezerve',
        clickable: false,
        highlightTime: selectedTime,
      }
    }

    return {
      displayStatus: 'empty',
      statusLabel: 'Müsait',
      clickable: true,
      highlightTime: selectedTime,
    }
  }

  if (isTableFreeForDay(table.reservations)) {
    return {
      displayStatus: 'empty',
      statusLabel: 'Müsait',
      clickable: true,
    }
  }

  return {
    displayStatus: 'reserved',
    statusLabel: 'Rezervasyon var',
    clickable: false,
  }
}
