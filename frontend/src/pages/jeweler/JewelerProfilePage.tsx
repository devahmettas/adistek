import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/Card'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import JewelerSettingsPanel from '../../components/jeweler/JewelerSettingsPanel'
import JewelerStaffManagePanel from '../../components/jeweler/JewelerStaffManagePanel'
import JewelerBusinessInfoPanel from '../../components/jeweler/JewelerBusinessInfoPanel'
import { getJewelerProfile } from '../../api/jewelerStaff'
import { useAuth } from '../../store/AuthStore'
import {
  formatMembershipEndDate,
  formatMembershipStatus,
  formatServiceFee,
} from '../../utils/adminMembership'
import { useJewelerPermissions } from '../../hooks/useJewelerPermissions'

type ProfileTab = 'plan' | 'settings' | 'staff'

export default function JewelerProfilePage() {
  const { restaurant, isOwner } = useAuth()
  const { can } = useJewelerPermissions()
  const [activeTab, setActiveTab] = useState<ProfileTab>('plan')
  const [loading, setLoading] = useState(isOwner)
  const [error, setError] = useState<string | null>(null)

  const membership = useMemo(() => ({
    service_fee: restaurant?.service_fee,
    membership_end_date: restaurant?.membership_end_date,
    membership_days_remaining: restaurant?.membership_days_remaining,
    membership_expired: restaurant?.membership_expired,
  }), [restaurant])

  useEffect(() => {
    if (!isOwner) {
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        await getJewelerProfile()
      } catch {
        setError('Profil bilgileri yüklenemedi.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [isOwner])

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Profil"
          description="Personel hesabı ile giriş yaptınız."
        />
        <Card title="Erişim bilgisi">
          <p className="text-sm text-slate-600">
            Üyelik ve personel yönetimi yalnızca işletme sahibi tarafından görüntülenebilir.
          </p>
        </Card>
      </div>
    )
  }

  const tabs: Array<{ id: ProfileTab; label: string; visible: boolean }> = [
    { id: 'plan', label: 'Plan', visible: true },
    { id: 'settings', label: 'Ayarlar', visible: can('manage_settings') },
    { id: 'staff', label: 'Personel', visible: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil"
        description="Üyelik planınızı, operasyonel ayarları ve personeli yönetin."
      />

      {error && <p className="alert-error">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {tabs.filter((tab) => tab.visible).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && activeTab === 'plan' ? <LoadingState /> : null}

      {activeTab === 'plan' && !loading && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card title="Mevcut Plan">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 px-6 py-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-100">
                  Kuyumcu Panel Üyeliği
                </p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight">
                  {formatMembershipStatus(
                    membership.membership_days_remaining,
                    membership.membership_expired,
                    membership.membership_end_date,
                  )}
                </p>
                <p className="mt-2 text-sm text-brand-100">
                  Bitiş tarihi: {formatMembershipEndDate(membership.membership_end_date)}
                </p>
              </div>

              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-600">Kalan gün</dt>
                  <dd className="font-semibold text-slate-900">
                    {membership.membership_expired
                      ? '0'
                      : membership.membership_days_remaining ?? '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-600">Yenileme ücreti</dt>
                  <dd className="font-semibold text-brand-700">
                    {formatServiceFee(membership.service_fee)}
                  </dd>
                </div>
              </dl>

              {membership.membership_expired ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  Üyelik süreniz dolmuş. Yenileme için yöneticinizle iletişime geçin.
                </p>
              ) : (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Üyeliğiniz aktif. Yenileme bedeli {formatServiceFee(membership.service_fee)} olarak görünüyor.
                </p>
              )}
            </div>
          </Card>

          <Card title="İşletme Bilgileri" description="İşletme iletişim bilgileriniz.">
            <JewelerBusinessInfoPanel />
          </Card>
        </section>
      )}

      {activeTab === 'settings' && can('manage_settings') && <JewelerSettingsPanel />}

      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Personel girişi için ana giriş ekranında <strong>Çalışan Girişi</strong> seçeneğini kullanın.
          </div>
          <JewelerStaffManagePanel />
        </div>
      )}

      {activeTab === 'settings' && !can('manage_settings') && (
        <Card title="Ayarlar">
          <p className="text-sm text-slate-600">Operasyonel ayarlara erişim yetkiniz yok.</p>
          <Link to="/dashboard/jeweler/profile" className="mt-3 inline-block text-sm font-semibold text-brand-700">
            Plana dön
          </Link>
        </Card>
      )}
    </div>
  )
}
