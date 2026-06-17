import { FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getReservationDay,
  type ReservationDayTable,
  type UpdateReservationPayload,
} from '../../api/reservations'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import {
  addMinutesToTime,
  computeDurationMinutes,
  findReservationForSlot,
  type ReservationOperatingHours,
} from '../../utils/reservationSlotUtils'
import Button from '../Button'
import Input from '../Input'
import ReservationDetailList from './ReservationDetailList'
import ReservationTimeSlotGrid from './ReservationTimeSlotGrid'

interface ReservationFormModalProps {
  table: ReservationDayTable
  selectedDate: string
  prefilledTime?: string | null
  durationMinutes: number
  operatingHours: ReservationOperatingHours
  submitting: boolean
  error: string | null
  cancellingId: number | null
  updatingId: number | null
  onClose: () => void
  onSubmit: (payload: {
    customer_name: string
    phone: string
    guest_count: number
    reserved_at: string
    duration_minutes: number
    reservation_date: string
  }) => Promise<void>
  onCancelReservation: (reservationId: number) => Promise<void>
  onUpdateReservation: (reservationId: number, payload: UpdateReservationPayload) => Promise<void>
}

export default function ReservationFormModal({
  table,
  selectedDate,
  prefilledTime = null,
  durationMinutes,
  operatingHours,
  submitting,
  error,
  cancellingId,
  updatingId,
  onClose,
  onSubmit,
  onCancelReservation,
  onUpdateReservation,
}: ReservationFormModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [guestCount, setGuestCount] = useState('2')
  const [reservationDate, setReservationDate] = useState(selectedDate)
  const [selectedTime, setSelectedTime] = useState<string | null>(prefilledTime)
  const [startTime, setStartTime] = useState(prefilledTime ?? '')
  const [endTime, setEndTime] = useState(
    prefilledTime ? addMinutesToTime(prefilledTime, durationMinutes) : '',
  )
  const [existingReservations, setExistingReservations] = useState(table.reservations)
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [slotError, setSlotError] = useState<string | null>(null)

  useBodyScrollLock(true)

  useEffect(() => {
    setReservationDate(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    setExistingReservations(table.reservations)
  }, [table.reservations])

  useEffect(() => {
    setSelectedTime(prefilledTime)
    setSlotError(null)

    if (prefilledTime) {
      setStartTime(prefilledTime)
      setEndTime(addMinutesToTime(prefilledTime, durationMinutes))
    }
  }, [reservationDate, table.id, prefilledTime, durationMinutes])

  useEffect(() => {
    if (!selectedTime) {
      return
    }

    const reserved = findReservationForSlot(
      reservationDate,
      selectedTime,
      existingReservations,
      durationMinutes,
    )

    if (reserved) {
      setSelectedTime(null)
    }
  }, [existingReservations, reservationDate, selectedTime, durationMinutes])

  useEffect(() => {
    if (reservationDate === selectedDate) {
      setExistingReservations(table.reservations)
      return
    }

    let cancelled = false

    const loadReservations = async () => {
      setLoadingReservations(true)

      try {
        const overview = await getReservationDay(reservationDate)
        const dayTable = overview.tables.find((row) => row.id === table.id)

        if (!cancelled) {
          setExistingReservations(dayTable?.reservations ?? [])
        }
      } catch {
        if (!cancelled) {
          setExistingReservations([])
        }
      } finally {
        if (!cancelled) {
          setLoadingReservations(false)
        }
      }
    }

    void loadReservations()

    return () => {
      cancelled = true
    }
  }, [reservationDate, selectedDate, table.id, table.reservations])

  const handleSelectTime = (time: string) => {
    setSelectedTime(time)
    setStartTime(time)
    setEndTime(addMinutesToTime(time, durationMinutes))
    setSlotError(null)
  }

  const handleStartTimeChange = (value: string) => {
    setStartTime(value)
    setSelectedTime(value || null)

    if (value && !endTime) {
      setEndTime(addMinutesToTime(value, durationMinutes))
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSlotError(null)

    if (!startTime || !endTime) {
      setSlotError('Lütfen başlangıç ve bitiş saatini girin.')
      return
    }

    const duration = computeDurationMinutes(startTime, endTime)

    if (duration < 15) {
      setSlotError('Rezervasyon süresi en az 15 dakika olmalıdır.')
      return
    }

    if (duration > 480) {
      setSlotError('Rezervasyon süresi en fazla 480 dakika olabilir.')
      return
    }

    if (endTime <= startTime) {
      setSlotError('Bitiş saati başlangıç saatinden sonra olmalıdır.')
      return
    }

    const reservedAt = `${reservationDate}T${startTime}:00`

    await onSubmit({
      customer_name: customerName.trim(),
      phone: phone.trim(),
      guest_count: Number(guestCount),
      reserved_at: reservedAt,
      duration_minutes: duration,
      reservation_date: reservationDate,
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex min-h-[100dvh] items-center justify-center overflow-x-hidden overscroll-behavior-contain bg-slate-900/50 p-3 backdrop-blur-[1px] sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(94dvh,52rem)] w-full max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-w-4xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-modal-title"
      >
        <div className="shrink-0 border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Rezervasyon</p>
          <h2 id="reservation-modal-title" className="mt-1 text-2xl font-bold text-slate-900">
            {table.name}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-900">Yeni Rezervasyon</p>
              <Input
                label="Gün"
                name="reservationDate"
                type="date"
                value={reservationDate}
                onChange={(event) => setReservationDate(event.target.value)}
                required
              />

              {!prefilledTime && (
                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700">Başlangıç Saati Seçin</p>
                  {loadingReservations ? (
                    <p className="text-sm text-slate-500">Saatler yükleniyor...</p>
                  ) : (
                    <ReservationTimeSlotGrid
                      date={reservationDate}
                      reservations={existingReservations}
                      durationMinutes={durationMinutes}
                      operatingHours={operatingHours}
                      selectedTime={selectedTime}
                      onSelectTime={handleSelectTime}
                    />
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Başlangıç saati"
                  name="startTime"
                  type="time"
                  value={startTime}
                  onChange={(event) => handleStartTimeChange(event.target.value)}
                  min={operatingHours.startTime}
                  max={operatingHours.endTime}
                  required
                />
                <Input
                  label="Bitiş saati"
                  name="endTime"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  min={startTime || operatingHours.startTime}
                  max={operatingHours.endTime}
                  required
                />
              </div>

              {startTime && endTime && endTime > startTime && (
                <p className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-900">
                  Rezervasyon aralığı:{' '}
                  <span className="font-bold">
                    {startTime} – {endTime}
                  </span>{' '}
                  ({computeDurationMinutes(startTime, endTime)} dk)
                </p>
              )}

              {(slotError || error) && <p className="alert-error">{slotError ?? error}</p>}

              <Input
                label="Ad Soyad"
                name="customerName"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Örn: Ayşe Yılmaz"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Telefon"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="05XX XXX XX XX"
                  required
                />
                <Input
                  label="Kişi sayısı"
                  name="guestCount"
                  type="number"
                  min={1}
                  max={50}
                  value={guestCount}
                  onChange={(event) => setGuestCount(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">Bu Masanın Rezervasyonları</p>
              {!loadingReservations && (
                <ReservationDetailList
                  reservations={existingReservations}
                  tables={[{ id: table.id, name: table.name }]}
                  fixedTableId={table.id}
                  showFilters={false}
                  cancellingId={cancellingId}
                  updatingId={updatingId}
                  onCancel={onCancelReservation}
                  onUpdate={onUpdateReservation}
                />
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-3 border-t border-slate-100 px-6 py-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">
              Vazgeç
            </Button>
            <Button type="submit" disabled={submitting || !startTime || !endTime} className="flex-1">
              {submitting ? 'Kaydediliyor...' : 'Rezervasyon Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
