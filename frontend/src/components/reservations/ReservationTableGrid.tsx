import type { ReservationDayTable } from '../../api/reservations'
import { TABLE_STATUS_STYLES } from '../../constants/tableStatuses'
import { getReservationTableViewState } from '../../utils/reservationSlotUtils'

interface ReservationTableGridProps {
  tables: ReservationDayTable[]
  selectedDate: string
  selectedTime: string | null
  durationMinutes: number
  onSelectTable: (table: ReservationDayTable) => void
}

export default function ReservationTableGrid({
  tables,
  selectedDate,
  selectedTime,
  durationMinutes,
  onSelectTable,
}: ReservationTableGridProps) {
  if (tables.length === 0) {
    return <p className="text-sm text-slate-500">Henüz masa tanımlanmamış. Masa Ayarlarından ekleyin.</p>
  }

  const clickableCount = tables.filter(
    (table) =>
      getReservationTableViewState(table, selectedDate, selectedTime, durationMinutes).clickable,
  ).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {selectedTime
          ? `${selectedTime} saatinde ${clickableCount} müsait masa. Rezervasyon için müsait masaya tıklayın.`
          : `Gün boyunca rezervasyonu olmayan ${clickableCount} masa tıklanabilir. Saat seçerseniz o saate göre filtrelenir.`}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => {
          const viewState = getReservationTableViewState(
            table,
            selectedDate,
            selectedTime,
            durationMinutes,
          )
          const styles = TABLE_STATUS_STYLES[viewState.displayStatus] ?? TABLE_STATUS_STYLES.empty

          return (
            <button
              key={table.id}
              type="button"
              disabled={!viewState.clickable}
              onClick={() => onSelectTable(table)}
              className={`flex min-h-[9rem] flex-col justify-between rounded-2xl border-2 p-4 text-left shadow-card transition ${
                viewState.clickable ? 'hover:scale-[1.02] hover:shadow-panel' : 'cursor-not-allowed opacity-80'
              } ${styles.card}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-bold text-slate-900">{table.name}</p>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`} />
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
                  {viewState.statusLabel}
                </span>
                {viewState.highlightTime && viewState.clickable && (
                  <p className="text-xs font-semibold text-brand-700">{viewState.highlightTime} müsait</p>
                )}
              </div>

              <div className="mt-3 space-y-1">
                {table.reservations.length > 0 ? (
                  table.reservations.map((reservation) => (
                    <p key={reservation.id} className="truncate text-xs text-slate-700">
                      <span className="font-semibold">{reservation.reserved_time}</span> {reservation.customer_name}{' '}
                      · {reservation.guest_count} kişi
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    {viewState.clickable ? 'Rezervasyon eklenebilir' : 'Bu filtrede müsait değil'}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
