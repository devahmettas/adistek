import { FormEvent, useEffect, useState } from 'react'
import { updateRestaurantSettings, type RestaurantSettings } from '../../api/restaurantSettings'
import Button from '../Button'
import Input from '../Input'

interface ReservationSettingsPanelProps {
  settings: RestaurantSettings
  onSaved: (settings: RestaurantSettings) => void
}

export default function ReservationSettingsPanel({ settings, onSaved }: ReservationSettingsPanelProps) {
  const [durationMinutes, setDurationMinutes] = useState(String(settings.reservation_duration_minutes))
  const [visibleBeforeMinutes, setVisibleBeforeMinutes] = useState(
    String(settings.reservation_visible_before_minutes),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setDurationMinutes(String(settings.reservation_duration_minutes))
    setVisibleBeforeMinutes(String(settings.reservation_visible_before_minutes))
  }, [settings])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const saved = await updateRestaurantSettings({
        reservation_duration_minutes: Number(durationMinutes),
        reservation_visible_before_minutes: Number(visibleBeforeMinutes),
      })
      onSaved(saved)
      setSuccess(true)
    } catch {
      setError('Ayarlar kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel-surface space-y-4 p-5">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Rezervasyon Ayarları</h2>
        <p className="mt-1 text-xs text-slate-500">
          Süre ve &quot;Rezerve&quot; görünümü bu ayarlara göre belirlenir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            label="Rezervasyon süresi (dakika)"
            name="reservationDuration"
            type="number"
            min={15}
            max={480}
            step={15}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            required
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Her rezervasyon için masa bu süre boyunca ayrılır.
          </p>
        </div>
        <div>
          <Input
            label="Rezerve görünümü (dakika önce)"
            name="visibleBeforeMinutes"
            type="number"
            min={5}
            max={240}
            step={5}
            value={visibleBeforeMinutes}
            onChange={(event) => setVisibleBeforeMinutes(event.target.value)}
            required
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Rezervasyon saatine bu kadar dakika kala masada &quot;Rezerve&quot; yazar.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </Button>
        {success && !error && <p className="text-sm font-medium text-brand-700">Ayarlar kaydedildi.</p>}
        {error && <p className="alert-error">{error}</p>}
      </div>
    </form>
  )
}
