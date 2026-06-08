import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cancelReservation,
  createReservation,
  getReservationDay,
  updateReservation,
  type ReservationDayOverview,
  type ReservationDayTable,
  type UpdateReservationPayload,
} from '../../api/reservations'
import { getRestaurantSettings, type RestaurantSettings } from '../../api/restaurantSettings'
import Button from '../../components/Button'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import StaffActionToasts, { useStaffToasts } from '../../components/StaffActionToasts'
import ReservationFormModal from '../../components/reservations/ReservationFormModal'
import ReservationListPanel from '../../components/reservations/ReservationListPanel'
import ReservationSettingsPanel from '../../components/reservations/ReservationSettingsPanel'
import ReservationTableGrid from '../../components/reservations/ReservationTableGrid'
import ReservationTimeSlotGrid from '../../components/reservations/ReservationTimeSlotGrid'
import { todayLocalString } from '../../utils/dateHelpers'
import { buildPageReservationTimeSlots, getReservationTableViewState } from '../../utils/reservationSlotUtils'

type ReservationTab = 'tables' | 'settings'

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error) || !error.response?.data) {
    return fallback
  }

  const data = error.response.data as { message?: string }

  return data.message ?? fallback
}

const defaultSettings: RestaurantSettings = {
  reservation_duration_minutes: 60,
  reservation_visible_before_minutes: 60,
}

function tabButtonClass(isActive: boolean): string {
  return `rounded-xl px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-brand-700 text-white shadow-sm'
      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
  }`
}

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState<ReservationTab>('tables')
  const [selectedDate, setSelectedDate] = useState(todayLocalString())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [overview, setOverview] = useState<ReservationDayOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<ReservationDayTable | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings)
  const [listOpen, setListOpen] = useState(false)
  const { toasts, pushToast, dismissToast } = useStaffToasts()

  const durationMinutes = overview?.reservation_duration_minutes ?? settings.reservation_duration_minutes

  const pageTimeSlots = useMemo(() => {
    if (!overview) {
      return []
    }

    return buildPageReservationTimeSlots(selectedDate, overview.tables, durationMinutes)
  }, [overview, selectedDate, durationMinutes])

  const syncSelectedTable = useCallback((data: ReservationDayOverview) => {
    setSelectedTable((current) => {
      if (!current) {
        return current
      }

      return data.tables.find((table) => table.id === current.id) ?? current
    })
  }, [])

  const loadOverview = useCallback(
    async (date: string, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true)
        setError(null)
      }

      try {
        const data = await getReservationDay(date)
        setOverview(data)
        setSettings({
          reservation_duration_minutes: data.reservation_duration_minutes,
          reservation_visible_before_minutes: data.reservation_visible_before_minutes,
        })
        syncSelectedTable(data)
        return data
      } catch {
        if (!options?.silent) {
          setError('Rezervasyonlar yüklenemedi.')
        }
        return null
      } finally {
        if (!options?.silent) {
          setLoading(false)
        }
      }
    },
    [syncSelectedTable],
  )

  useEffect(() => {
    if (activeTab === 'tables') {
      void loadOverview(selectedDate)
    }
  }, [loadOverview, selectedDate, activeTab])

  useEffect(() => {
    setSelectedTime(null)
  }, [selectedDate])

  useEffect(() => {
    if (activeTab !== 'settings') {
      return
    }

    void getRestaurantSettings()
      .then(setSettings)
      .catch(() => undefined)
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'tables' || selectedDate !== todayLocalString()) {
      return
    }

    const intervalId = window.setInterval(() => {
      void loadOverview(selectedDate, { silent: true })
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [loadOverview, selectedDate, activeTab])

  const handleSelectTable = (table: ReservationDayTable) => {
    const viewState = getReservationTableViewState(table, selectedDate, selectedTime, durationMinutes)

    if (!viewState.clickable) {
      return
    }

    setSelectedTable(table)
    setFormError(null)
  }

  const handleCreateReservation = async (payload: {
    customer_name: string
    phone: string
    guest_count: number
    reserved_at: string
    reservation_date: string
  }) => {
    if (!selectedTable) {
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      const tableName = selectedTable.name
      const reservedTime = payload.reserved_at.slice(11, 16)

      await createReservation({
        restaurant_table_id: selectedTable.id,
        customer_name: payload.customer_name,
        phone: payload.phone,
        guest_count: payload.guest_count,
        reserved_at: payload.reserved_at,
      })

      setSelectedTable(null)
      setFormError(null)
      pushToast('success', `${tableName} için ${reservedTime} rezervasyonu oluşturuldu.`)

      if (payload.reservation_date !== selectedDate) {
        setSelectedDate(payload.reservation_date)
      } else {
        await loadOverview(selectedDate)
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Rezervasyon oluşturulamadı.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelReservation = async (reservationId: number) => {
    if (!window.confirm('Bu rezervasyon iptal edilsin mi?')) {
      return
    }

    setCancellingId(reservationId)

    try {
      await cancelReservation(reservationId)
      await loadOverview(selectedDate)
    } catch {
      window.alert('Rezervasyon iptal edilemedi.')
    } finally {
      setCancellingId(null)
    }
  }

  const handleUpdateReservation = async (reservationId: number, payload: UpdateReservationPayload) => {
    setUpdatingId(reservationId)

    try {
      await updateReservation(reservationId, payload)
      await loadOverview(selectedDate)
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Rezervasyon güncellenemedi.'))
    } finally {
      setUpdatingId(null)
    }
  }

  const tableOptions = overview?.tables.map((table) => ({ id: table.id, name: table.name })) ?? []

  const availableTableCount = overview
    ? overview.tables.filter((table) =>
        getReservationTableViewState(table, selectedDate, selectedTime, durationMinutes).clickable,
      ).length
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rezervasyonlar"
        description="Önce gün ve saat seçin, ardından müsait masaya tıklayarak rezervasyon oluşturun."
        actions={
          activeTab === 'tables' && overview ? (
            <Button type="button" variant="secondary" onClick={() => setListOpen(true)}>
              Rezervasyon Listesi ({overview.reservations.length})
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabButtonClass(activeTab === 'tables')} onClick={() => setActiveTab('tables')}>
          Masalar
        </button>
        <button
          type="button"
          className={tabButtonClass(activeTab === 'settings')}
          onClick={() => setActiveTab('settings')}
        >
          Ayarlar
        </button>
      </div>

      {activeTab === 'settings' && (
        <ReservationSettingsPanel
          settings={settings}
          onSaved={(saved) => {
            setSettings(saved)
            if (overview) {
              void loadOverview(selectedDate)
            }
          }}
        />
      )}

      {activeTab === 'tables' && (
        <>
          {loading && <LoadingState />}
          {error && <p className="alert-error">{error}</p>}

          {!loading && overview && (
            <div className="space-y-6">
              <section className="panel-surface space-y-5 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Gün Seçin</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Gün seçildiğinde o gün hiç rezervasyonu olmayan masalar tıklanabilir olur.
                  </p>
                </div>
                <div className="max-w-xs">
                  <Input
                    label="Gün"
                    name="reservationDate"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  />
                </div>
              </section>

              <section className="panel-surface space-y-5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Saat Seçin</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Saat seçildiğinde yalnızca o saatte müsait masalar tıklanabilir olur.
                    </p>
                  </div>
                  {selectedTime && (
                    <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedTime(null)}>
                      Saat seçimini temizle
                    </Button>
                  )}
                </div>
                <ReservationTimeSlotGrid
                  slots={pageTimeSlots}
                  durationMinutes={durationMinutes}
                  selectedTime={selectedTime}
                  onSelectTime={(time) => setSelectedTime((current) => (current === time ? null : time))}
                  compact
                />
              </section>

              <section className="panel-surface p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Masalar</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedTime
                        ? `${selectedTime} saati için müsait masaları seçin.`
                        : 'Gün boyunca boş masaları seçin veya önce saat filtreleyin.'}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {availableTableCount} / {overview.tables.length} tıklanabilir
                  </span>
                </div>
                <ReservationTableGrid
                  tables={overview.tables}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  durationMinutes={durationMinutes}
                  onSelectTable={handleSelectTable}
                />
              </section>
            </div>
          )}
        </>
      )}

      {listOpen && overview && (
        <ReservationListPanel
          selectedDate={selectedDate}
          reservations={overview.reservations}
          tables={tableOptions}
          cancellingId={cancellingId}
          updatingId={updatingId}
          onCancel={handleCancelReservation}
          onUpdate={handleUpdateReservation}
          onClose={() => setListOpen(false)}
        />
      )}

      <StaffActionToasts toasts={toasts} onDismiss={dismissToast} />

      {selectedTable && (
        <ReservationFormModal
          table={selectedTable}
          selectedDate={selectedDate}
          prefilledTime={selectedTime}
          durationMinutes={durationMinutes}
          submitting={submitting}
          error={formError}
          cancellingId={cancellingId}
          updatingId={updatingId}
          onClose={() => {
            setSelectedTable(null)
            setFormError(null)
          }}
          onSubmit={handleCreateReservation}
          onCancelReservation={handleCancelReservation}
          onUpdateReservation={handleUpdateReservation}
        />
      )}
    </div>
  )
}
