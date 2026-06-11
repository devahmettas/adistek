import type { TableReservation } from '../api/reservations'
import { todayLocalString } from './dateHelpers'

export const DEFAULT_RESERVATION_START_TIME = '10:00'
export const DEFAULT_RESERVATION_END_TIME = '23:00'

export interface ReservationOperatingHours {
  startTime: string
  endTime: string
}

export const DEFAULT_OPERATING_HOURS: ReservationOperatingHours = {
  startTime: DEFAULT_RESERVATION_START_TIME,
  endTime: DEFAULT_RESERVATION_END_TIME,
}

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

export function computeDurationMinutes(startTime: string, endTime: string): number {
  return toMinutes(endTime) - toMinutes(startTime)
}

export function addMinutesToTime(time: string, minutes: number): string {
  return toTimeString(toMinutes(time) + minutes)
}

export function generateReservationSlotTimes(
  durationMinutes: number,
  operatingHours: ReservationOperatingHours = DEFAULT_OPERATING_HOURS,
): string[] {
  const slots: string[] = []
  const startMinutes = toMinutes(operatingHours.startTime)
  const endMinutes = toMinutes(operatingHours.endTime)

  for (let current = startMinutes; current + durationMinutes <= endMinutes; current += durationMinutes) {
    slots.push(toTimeString(current))
  }

  return slots
}

function getReservationWindow(reservation: TableReservation) {
  const start = new Date(reservation.reserved_at).getTime()
  const duration = reservation.duration_minutes
  const end = start + duration * 60_000

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
    const { start, end } = getReservationWindow(reservation)

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
  operatingHours: ReservationOperatingHours = DEFAULT_OPERATING_HOURS,
): ReservationTimeSlot[] {
  return generateReservationSlotTimes(durationMinutes, operatingHours).map((time) => {
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

export function formatReservationTimeRange(reservation: TableReservation): string {
  if (reservation.reserved_end_time) {
    return `${reservation.reserved_time} – ${reservation.reserved_end_time}`
  }

  return formatSlotRange(reservation.reserved_time, reservation.duration_minutes)
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
  operatingHours: ReservationOperatingHours = DEFAULT_OPERATING_HOURS,
): ReservationTimeSlot[] {
  return generateReservationSlotTimes(durationMinutes, operatingHours).map((time) => {
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
