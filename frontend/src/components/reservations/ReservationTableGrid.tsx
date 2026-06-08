import type { ReservationDayTable } from '../../api/reservations'
import { TABLE_STATUS_LABELS, TABLE_STATUS_STYLES, type TableStatus } from '../../constants/tableStatuses'

interface ReservationTableGridProps {
  tables: ReservationDayTable[]
  onSelectTable: (table: ReservationDayTable) => void
}

export default function ReservationTableGrid({ tables, onSelectTable }: ReservationTableGridProps) {
  if (tables.length === 0) {
    return <p className="text-sm text-slate-500">Henüz masa tanımlanmamış. Masa Ayarlarından ekleyin.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {tables.map((table) => {
        const displayStatus: TableStatus = table.is_actively_reserved
          ? 'reserved'
          : ((table.current_status || 'empty') as TableStatus)
        const styles = TABLE_STATUS_STYLES[displayStatus] ?? TABLE_STATUS_STYLES.empty
        const statusLabel = table.is_actively_reserved
          ? 'Rezerve'
          : table.has_reservations_on_date
            ? 'Rezervasyon var'
            : TABLE_STATUS_LABELS[displayStatus]

        return (
          <button
            key={table.id}
            type="button"
            onClick={() => onSelectTable(table)}
            className={`flex min-h-[9rem] flex-col justify-between rounded-2xl border-2 p-4 text-left shadow-card transition hover:scale-[1.02] hover:shadow-panel ${styles.card}`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-lg font-bold text-slate-900">{table.name}</p>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`} />
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
                {statusLabel}
              </span>
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
                <p className="text-xs text-slate-500">Rezervasyon yok — tıklayarak ekle</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
