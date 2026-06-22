import { FormEvent, useState } from 'react'
import type { UpdateAdminRestaurantPayload } from '../../api/adminAuth'
import type { RestaurantListItem } from '../../api/types'
import { getApiErrorMessage } from '../../utils/adminDashboard'
import {
  formatMembershipEndDate,
  formatMembershipStatus,
  formatServiceFee,
} from '../../utils/adminMembership'
import Button from '../Button'
import Input from '../Input'

interface AdminRestaurantMembershipSettingsProps {
  restaurant: RestaurantListItem
  onAdjustMembership: (id: number, days: number) => Promise<unknown>
  onUpdate: (id: number, payload: UpdateAdminRestaurantPayload) => Promise<unknown>
}

function buildUpdatePayload(
  restaurant: RestaurantListItem,
  overrides: Partial<UpdateAdminRestaurantPayload>,
): UpdateAdminRestaurantPayload {
  return {
    name: restaurant.name,
    contact_person: restaurant.contact_person ?? '',
    phone: restaurant.phone ?? '',
    address: restaurant.address ?? '',
    email: restaurant.email,
    service_fee: Number(restaurant.service_fee ?? 0),
    membership_end_date: restaurant.membership_end_date ?? undefined,
    ...overrides,
  }
}

export default function AdminRestaurantMembershipSettings({
  restaurant,
  onAdjustMembership,
  onUpdate,
}: AdminRestaurantMembershipSettingsProps) {
  const expired = Boolean(restaurant.membership_expired)
  const [customAddDays, setCustomAddDays] = useState('30')
  const [customReduceDays, setCustomReduceDays] = useState('7')
  const [feeInput, setFeeInput] = useState(String(restaurant.service_fee ?? 0))
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const runAction = async (key: string, action: () => Promise<unknown>) => {
    setBusyAction(key)
    setActionError(null)

    try {
      await action()
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'İşlem tamamlanamadı.'))
    } finally {
      setBusyAction(null)
    }
  }

  const handleAdjust = (days: number) => {
    void runAction(`adjust-${days}`, () => onAdjustMembership(restaurant.id, days))
  }

  const handleCustomAdd = (event: FormEvent) => {
    event.preventDefault()
    const days = Number.parseInt(customAddDays, 10)

    if (!Number.isFinite(days) || days < 1) {
      setActionError('Geçerli bir gün sayısı girin.')
      return
    }

    void runAction('adjust-add-custom', () => onAdjustMembership(restaurant.id, days))
  }

  const handleCustomReduce = (event: FormEvent) => {
    event.preventDefault()
    const days = Number.parseInt(customReduceDays, 10)

    if (!Number.isFinite(days) || days < 1) {
      setActionError('Geçerli bir gün sayısı girin.')
      return
    }

    void runAction('adjust-reduce-custom', () => onAdjustMembership(restaurant.id, -days))
  }

  const handleFeeSave = () => {
    const fee = Number.parseFloat(feeInput.replace(',', '.'))

    if (!Number.isFinite(fee) || fee < 0) {
      setActionError('Geçerli bir hizmet bedeli girin.')
      return
    }

    void runAction('fee', () =>
      onUpdate(restaurant.id, buildUpdatePayload(restaurant, { service_fee: fee })),
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-800">Üyelik Yönetimi</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Hizmet bedeli ve üyelik süresini buradan yönetin.
        </p>
      </div>

      <div className="space-y-4 p-4">
        {expired && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            Üyelik süresi doldu — işletme giriş yapamaz. Gün ekleyerek erişimi yeniden açın.
          </div>
        )}

        <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Aylık Hizmet Bedeli
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatServiceFee(restaurant.service_fee)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Üyelik</p>
            <p
              className={`mt-1 text-lg font-bold ${
                expired
                  ? 'text-red-700'
                  : restaurant.membership_days_remaining === 0
                    ? 'text-amber-700'
                    : 'text-emerald-700'
              }`}
            >
              {formatMembershipStatus(
                restaurant.membership_days_remaining,
                restaurant.membership_expired,
                restaurant.membership_end_date,
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Bitiş: {formatMembershipEndDate(restaurant.membership_end_date)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Gün ekle</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busyAction !== null}
              onClick={() => handleAdjust(7)}
            >
              {busyAction === 'adjust-7' ? '...' : '+7 gün'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busyAction !== null}
              onClick={() => handleAdjust(30)}
            >
              {busyAction === 'adjust-30' ? '...' : '+30 gün'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busyAction !== null}
              onClick={() => handleAdjust(90)}
            >
              {busyAction === 'adjust-90' ? '...' : '+90 gün'}
            </Button>
          </div>

          <form onSubmit={handleCustomAdd} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[120px] flex-1">
              <Input
                label="Özel gün ekle"
                name={`customAddDays-${restaurant.id}`}
                type="number"
                min={1}
                max={3650}
                value={customAddDays}
                onChange={(event) => setCustomAddDays(event.target.value)}
              />
            </div>
            <Button type="submit" size="sm" disabled={busyAction !== null}>
              {busyAction === 'adjust-add-custom' ? '...' : 'Ekle'}
            </Button>
          </form>
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-600">Gün azalt</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busyAction !== null}
              onClick={() => handleAdjust(-7)}
            >
              {busyAction === 'adjust--7' ? '...' : '−7 gün'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busyAction !== null}
              onClick={() => handleAdjust(-30)}
            >
              {busyAction === 'adjust--30' ? '...' : '−30 gün'}
            </Button>
          </div>

          <form onSubmit={handleCustomReduce} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[120px] flex-1">
              <Input
                label="Özel gün azalt"
                name={`customReduceDays-${restaurant.id}`}
                type="number"
                min={1}
                max={3650}
                value={customReduceDays}
                onChange={(event) => setCustomReduceDays(event.target.value)}
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" disabled={busyAction !== null}>
              {busyAction === 'adjust-reduce-custom' ? '...' : 'Azalt'}
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
          <div className="min-w-[140px] flex-1">
            <Input
              label="Hizmet bedeli (₺)"
              name={`serviceFee-${restaurant.id}`}
              type="number"
              min={0}
              step="0.01"
              value={feeInput}
              onChange={(event) => setFeeInput(event.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busyAction !== null}
            onClick={handleFeeSave}
          >
            {busyAction === 'fee' ? '...' : 'Kaydet'}
          </Button>
        </div>

        {actionError && <p className="text-xs font-medium text-red-600">{actionError}</p>}
      </div>
    </section>
  )
}
