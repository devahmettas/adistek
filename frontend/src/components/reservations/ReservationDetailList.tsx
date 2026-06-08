import { FormEvent, useMemo, useState } from 'react'
import type { TableReservation, UpdateReservationPayload } from '../../api/reservations'
import {
  defaultReservationListFilters,
  filterReservations,
  getReservationListStats,
  parseReservationDateTime,
  type ReservationListFilters,
  type TimePeriodFilter,
} from '../../utils/reservationListUtils'
import Button from '../Button'
import Input from '../Input'
import Select from '../Select'

interface ReservationTableOption {
  id: number
  name: string
}

interface ReservationDetailListProps {
  reservations: TableReservation[]
  tables: ReservationTableOption[]
  fixedTableId?: number
  showFilters?: boolean
  cancellingId: number | null
  updatingId: number | null
  onCancel: (reservationId: number) => Promise<void>
  onUpdate: (reservationId: number, payload: UpdateReservationPayload) => Promise<void>
}

function formatReservationDate(reservedAt: string): string {
  return new Date(reservedAt).toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

export default function ReservationDetailList({
  reservations,
  tables,
  fixedTableId,
  showFilters = true,
  cancellingId,
  updatingId,
  onCancel,
  onUpdate,
}: ReservationDetailListProps) {
  const [filters, setFilters] = useState<ReservationListFilters>({
    ...defaultReservationListFilters,
    tableId: fixedTableId ? String(fixedTableId) : 'all',
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    restaurant_table_id: '',
    customer_name: '',
    phone: '',
    guest_count: '2',
    date: '',
    time: '',
  })

  const effectiveFilters = fixedTableId
    ? { ...filters, tableId: String(fixedTableId) }
    : filters

  const filteredReservations = useMemo(
    () => filterReservations(reservations, effectiveFilters),
    [reservations, effectiveFilters],
  )

  const stats = useMemo(() => getReservationListStats(filteredReservations), [filteredReservations])

  const tableOptions = useMemo(
    () => [
      { value: 'all', label: 'Tüm masalar' },
      ...tables.map((table) => ({ value: String(table.id), label: table.name })),
    ],
    [tables],
  )

  const timePeriodOptions: { value: TimePeriodFilter; label: string }[] = [
    { value: 'all', label: 'Tüm saatler' },
    { value: 'morning', label: 'Sabah (00:00–11:59)' },
    { value: 'afternoon', label: 'Öğle (12:00–16:59)' },
    { value: 'evening', label: 'Akşam (17:00+)' },
  ]

  const startEditing = (reservation: TableReservation) => {
    const { date, time } = parseReservationDateTime(reservation.reserved_at)

    setEditingId(reservation.id)
    setEditError(null)
    setEditForm({
      restaurant_table_id: String(fixedTableId ?? reservation.restaurant_table_id),
      customer_name: reservation.customer_name,
      phone: reservation.phone,
      guest_count: String(reservation.guest_count),
      date,
      time,
    })
  }

  const handleEditSubmit = async (event: FormEvent, reservationId: number) => {
    event.preventDefault()
    setEditError(null)

    try {
      await onUpdate(reservationId, {
        restaurant_table_id: Number(editForm.restaurant_table_id),
        customer_name: editForm.customer_name.trim(),
        phone: editForm.phone.trim(),
        guest_count: Number(editForm.guest_count),
        reserved_at: `${editForm.date}T${editForm.time}:00`,
      })
      setEditingId(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Rezervasyon güncellenemedi.')
    }
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Ara"
              name="reservationSearch"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Ad, telefon veya masa"
            />
            {!fixedTableId && (
              <Select
                label="Masa"
                name="tableFilter"
                value={filters.tableId}
                onChange={(event) => setFilters((current) => ({ ...current, tableId: event.target.value }))}
                options={tableOptions}
              />
            )}
            <Select
              label="Saat aralığı"
              name="timePeriodFilter"
              value={filters.timePeriod}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  timePeriod: event.target.value as TimePeriodFilter,
                }))
              }
              options={timePeriodOptions}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() =>
                  setFilters({
                    ...defaultReservationListFilters,
                    tableId: fixedTableId ? String(fixedTableId) : 'all',
                  })
                }
              >
                Filtreleri Temizle
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              {stats.reservationCount} rezervasyon
            </span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              {stats.tableCount} masa
            </span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              {stats.guestCount} kişi
            </span>
          </div>
        </div>
      )}

      {filteredReservations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-card">
          <p className="text-sm text-slate-500">
            {reservations.length === 0
              ? 'Bu gün için rezervasyon bulunmuyor.'
              : 'Filtrelere uygun rezervasyon bulunamadı.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredReservations.map((reservation) => {
            const isEditing = editingId === reservation.id

            return (
              <li
                key={reservation.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5"
              >
                {isEditing ? (
                  <form onSubmit={(event) => void handleEditSubmit(event, reservation.id)} className="space-y-4">
                    <p className="text-sm font-bold text-slate-900">Rezervasyonu Düzenle</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {!fixedTableId && (
                        <Select
                          label="Masa"
                          name={`table-${reservation.id}`}
                          value={editForm.restaurant_table_id}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              restaurant_table_id: event.target.value,
                            }))
                          }
                          options={tables.map((table) => ({
                            value: String(table.id),
                            label: table.name,
                          }))}
                          required
                        />
                      )}
                      <Input
                        label="Gün"
                        name={`date-${reservation.id}`}
                        type="date"
                        value={editForm.date}
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, date: event.target.value }))
                        }
                        required
                      />
                      <Input
                        label="Saat"
                        name={`time-${reservation.id}`}
                        type="time"
                        value={editForm.time}
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, time: event.target.value }))
                        }
                        required
                      />
                      <Input
                        label="Ad Soyad"
                        name={`name-${reservation.id}`}
                        value={editForm.customer_name}
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, customer_name: event.target.value }))
                        }
                        required
                      />
                      <Input
                        label="Telefon"
                        name={`phone-${reservation.id}`}
                        type="tel"
                        value={editForm.phone}
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, phone: event.target.value }))
                        }
                        required
                      />
                      <Input
                        label="Kişi sayısı"
                        name={`guests-${reservation.id}`}
                        type="number"
                        min={1}
                        max={50}
                        value={editForm.guest_count}
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, guest_count: event.target.value }))
                        }
                        required
                      />
                    </div>
                    {editError && <p className="alert-error">{editError}</p>}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingId(null)
                          setEditError(null)
                        }}
                        disabled={updatingId === reservation.id}
                      >
                        Vazgeç
                      </Button>
                      <Button type="submit" disabled={updatingId === reservation.id}>
                        {updatingId === reservation.id ? 'Kaydediliyor...' : 'Kaydet'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                          {reservation.table_name ?? 'Masa'}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {reservation.reserved_time}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {reservation.guest_count} kişi
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {reservation.duration_minutes} dk
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">{reservation.customer_name}</p>
                        <p className="mt-1 text-sm text-slate-600">{reservation.phone}</p>
                        <p className="mt-2 text-sm font-medium text-slate-800">
                          {formatReservationDate(reservation.reserved_at)} · {reservation.reserved_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => startEditing(reservation)}
                        disabled={cancellingId === reservation.id || updatingId === reservation.id}
                      >
                        Düzenle
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => void onCancel(reservation.id)}
                        disabled={cancellingId === reservation.id || updatingId === reservation.id}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        {cancellingId === reservation.id ? '...' : 'İptal Et'}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
