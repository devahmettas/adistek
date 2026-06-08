import { createPortal } from 'react-dom'
import type { TableReservation, UpdateReservationPayload } from '../../api/reservations'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import Button from '../Button'
import ReservationDetailList from './ReservationDetailList'

interface ReservationTableOption {
  id: number
  name: string
}

interface ReservationListPanelProps {
  selectedDate: string
  reservations: TableReservation[]
  tables: ReservationTableOption[]
  cancellingId: number | null
  updatingId: number | null
  onCancel: (reservationId: number) => Promise<void>
  onUpdate: (reservationId: number, payload: UpdateReservationPayload) => Promise<void>
  onClose: () => void
}

export default function ReservationListPanel({
  selectedDate,
  reservations,
  tables,
  cancellingId,
  updatingId,
  onCancel,
  onUpdate,
  onClose,
}: ReservationListPanelProps) {
  useBodyScrollLock(true)

  const formattedDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex min-h-[100dvh] items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px] sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(92dvh,52rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-list-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Rezervasyonlar</p>
            <h2 id="reservation-list-title" className="mt-1 text-2xl font-bold text-slate-900">
              Rezervasyon Listesi
            </h2>
            <p className="mt-1 text-sm text-slate-500">{formattedDate}</p>
            <p className="mt-2 text-sm text-slate-600">
              Toplam {reservations.length} kayıt · Arama ve filtrelerle detaylı görüntüleyin.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose} className="shrink-0">
            Kapat
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ReservationDetailList
            reservations={reservations}
            tables={tables}
            showFilters
            cancellingId={cancellingId}
            updatingId={updatingId}
            onCancel={onCancel}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
