import { FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getReservationDay,
  type ReservationDayTable,
  type UpdateReservationPayload,
} from '../../api/reservations'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import Button from '../Button'
import Input from '../Input'
import ReservationDetailList from './ReservationDetailList'

interface ReservationFormModalProps {
  table: ReservationDayTable
  selectedDate: string
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
    reservation_date: string
  }) => Promise<void>
  onCancelReservation: (reservationId: number) => Promise<void>
  onUpdateReservation: (reservationId: number, payload: UpdateReservationPayload) => Promise<void>
}

export default function ReservationFormModal({
  table,
  selectedDate,
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
  const [time, setTime] = useState('19:00')
  const [existingReservations, setExistingReservations] = useState(table.reservations)
  const [loadingReservations, setLoadingReservations] = useState(false)

  useBodyScrollLock(true)

  useEffect(() => {
    setReservationDate(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    setExistingReservations(table.reservations)
  }, [table.reservations])

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const reservedAt = `${reservationDate}T${time}:00`

    await onSubmit({
      customer_name: customerName.trim(),
      phone: phone.trim(),
      guest_count: Number(guestCount),
      reserved_at: reservedAt,
      reservation_date: reservationDate,
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex min-h-[100dvh] items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px] sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(94dvh,52rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
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
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Gün"
                  name="reservationDate"
                  type="date"
                  value={reservationDate}
                  onChange={(event) => setReservationDate(event.target.value)}
                  required
                />
                <Input
                  label="Saat"
                  name="time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  required
                />
              </div>
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

            {error && <p className="alert-error">{error}</p>}

            <div className="border-t border-slate-100 pt-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">Bu Masanın Rezervasyonları</p>
              {loadingReservations ? (
                <p className="text-sm text-slate-500">Rezervasyonlar kontrol ediliyor...</p>
              ) : (
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
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Kaydediliyor...' : 'Rezervasyon Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
