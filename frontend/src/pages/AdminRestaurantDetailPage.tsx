import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteAdminRestaurant,
  extendAdminRestaurantMembership,
  getAdminRestaurant,
  updateAdminRestaurant,
  updateAdminRestaurantFeatures,
} from '../api/adminAuth'
import type { RestaurantListItem } from '../api/types'
import AdminJewelerFeatureSettings from '../components/admin/AdminJewelerFeatureSettings'
import AdminRestaurantMembershipSettings from '../components/admin/AdminRestaurantMembershipSettings'
import GoogleMapsDirectionsButton from '../components/admin/GoogleMapsDirectionsButton'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import { BUSINESS_TYPE_LABELS, isJewelerBusiness } from '../constants/businessType'
import { displayAdminValue, getApiErrorMessage } from '../utils/adminDashboard'

type EditableField = 'name' | 'contact_person' | 'phone' | 'address' | 'email' | 'password'

const fieldClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function buildPayload(restaurant: RestaurantListItem, overrides: Partial<Record<EditableField, string>>) {
  return {
    name: overrides.name ?? restaurant.name,
    contact_person: overrides.contact_person ?? restaurant.contact_person ?? '',
    phone: overrides.phone ?? restaurant.phone ?? '',
    address: overrides.address ?? restaurant.address ?? '',
    email: overrides.email ?? restaurant.email,
    password: overrides.password?.trim() || undefined,
  }
}

interface DetailListRowProps {
  label: string
  value: string
  href?: string
  editable?: boolean
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  saving: boolean
  error?: string | null
  editContent?: React.ReactNode
  footer?: React.ReactNode
}

function DetailListRow({
  label,
  value,
  href,
  editable = true,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  saving,
  error,
  editContent,
  footer,
}: DetailListRowProps) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <dt className="w-28 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:w-32">
          {label}
        </dt>

        <dd className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-2">
              {editContent}
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : href ? (
            <a href={href} className="break-all text-sm font-medium text-brand-700 hover:underline">
              {value}
            </a>
          ) : (
            <span className="break-words text-sm font-medium text-slate-900">{value}</span>
          )}
          {!isEditing && footer}
        </dd>

        {editable && !isEditing && (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Düzenle
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminRestaurantDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const restaurantId = Number(id)

  const [restaurant, setRestaurant] = useState<RestaurantListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [featureError, setFeatureError] = useState<string | null>(null)

  const loadRestaurant = useCallback(async () => {
    if (Number.isNaN(restaurantId)) {
      setError('Geçersiz işletme.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      setRestaurant(await getAdminRestaurant(restaurantId))
    } catch {
      setError('İşletme bulunamadı.')
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    void loadRestaurant()
  }, [loadRestaurant])

  const startEdit = (field: EditableField, currentValue: string) => {
    setEditingField(field)
    setDraft(currentValue)
    setRowError(null)
  }

  const cancelEdit = () => {
    setEditingField(null)
    setDraft('')
    setRowError(null)
  }

  const saveField = async (field: EditableField) => {
    if (!restaurant) {
      return
    }

    const trimmed = draft.trim()

    if (field === 'password') {
      if (!trimmed) {
        setRowError('Yeni şifre girin.')
        return
      }
      if (trimmed.length < 6) {
        setRowError('Şifre en az 6 karakter olmalıdır.')
        return
      }
    } else if (!trimmed) {
      setRowError('Bu alan boş bırakılamaz.')
      return
    }

    setSaving(true)
    setRowError(null)

    try {
      const updated = await updateAdminRestaurant(
        restaurant.id,
        buildPayload(restaurant, { [field]: trimmed }),
      )
      setRestaurant(updated)
      cancelEdit()
    } catch (submitError) {
      setRowError(getApiErrorMessage(submitError, 'Kaydedilemedi.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingState label="İşletme yükleniyor..." />
  }

  if (error || !restaurant) {
    return (
      <div className="space-y-4">
        <p className="alert-error">{error ?? 'İşletme bulunamadı.'}</p>
        <Link
          to="/admin/restaurants/list"
          className="text-sm font-medium text-slate-500 transition hover:text-brand-700"
        >
          ← İşletme Listesi
        </Link>
      </div>
    )
  }

  const phoneValue = displayAdminValue(restaurant.phone)
  const phoneHref =
    restaurant.phone && restaurant.phone.trim()
      ? `tel:${restaurant.phone.replace(/\s/g, '')}`
      : undefined

  const isJeweler = isJewelerBusiness(restaurant.business_type)
  const typeLabel = isJeweler ? 'Kuyumcu' : BUSINESS_TYPE_LABELS[restaurant.business_type ?? 'restaurant']

  const rowProps = (field: EditableField) => ({
    isEditing: editingField === field,
    onEdit: () => startEdit(field, getFieldValue(restaurant, field)),
    onCancel: cancelEdit,
    onSave: () => void saveField(field),
    saving,
    error: editingField === field ? rowError : null,
  })

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `"${restaurant.name}" işletmesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)

    try {
      await deleteAdminRestaurant(restaurant.id)
      navigate('/admin/restaurants/list')
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'İşletme silinemedi.'))
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link
          to="/admin/restaurants/list"
          className="text-sm font-medium text-slate-500 transition hover:text-brand-700"
        >
          ← İşletme Listesi
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{restaurant.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-md bg-brand-50 px-2 py-1 font-semibold text-brand-800">
            {typeLabel}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">
            #{restaurant.id}
          </span>
          {isJeweler ? (
            <>
              <span>{restaurant.jewelry_products_count ?? 0} ürün</span>
              <span>·</span>
              <span>{restaurant.jewelry_sales_count ?? 0} satış</span>
              <span>·</span>
              <span>{restaurant.jewelry_repairs_count ?? 0} tamir</span>
            </>
          ) : (
            <>
              <span>{restaurant.categories_count} kategori</span>
              <span>·</span>
              <span>{restaurant.products_count} ürün</span>
              <span>·</span>
              <span>{restaurant.tables_count} masa</span>
            </>
          )}
          <span>·</span>
          <span>{new Date(restaurant.created_at).toLocaleDateString('tr-TR')}</span>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-800">İşletme Bilgileri</h2>
        </div>
        <dl>
          <DetailListRow
            label="İşletme Adı"
            value={restaurant.name}
            {...rowProps('name')}
            editContent={
              <input
                className={fieldClassName}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                autoFocus
              />
            }
          />
          <DetailListRow
            label="Yetkili Kişi"
            value={displayAdminValue(restaurant.contact_person)}
            {...rowProps('contact_person')}
            editContent={
              <input
                className={fieldClassName}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                autoFocus
              />
            }
          />
          <DetailListRow
            label="Telefon"
            value={phoneValue}
            href={phoneHref}
            {...rowProps('phone')}
            editContent={
              <input
                className={fieldClassName}
                type="tel"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                autoFocus
              />
            }
          />
          <DetailListRow
            label="E-posta"
            value={restaurant.email}
            href={`mailto:${restaurant.email}`}
            {...rowProps('email')}
            editContent={
              <input
                className={fieldClassName}
                type="email"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                autoFocus
              />
            }
          />
          <DetailListRow
            label="Adres"
            value={displayAdminValue(restaurant.address)}
            {...rowProps('address')}
            footer={<GoogleMapsDirectionsButton address={restaurant.address} className="mt-2" />}
            editContent={
              <textarea
                className={`${fieldClassName} min-h-[72px] resize-y`}
                rows={2}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                autoFocus
              />
            }
          />
          <DetailListRow
            label="Şifre"
            value="••••••••"
            {...rowProps('password')}
            editContent={
              <input
                className={fieldClassName}
                type="password"
                minLength={6}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Yeni şifre"
                autoFocus
              />
            }
          />
          {!isJeweler && restaurant.slug && (
            <DetailListRow
              label="Menü Linki"
              value={restaurant.slug}
              href={`/menu/${restaurant.slug}`}
              editable={false}
              isEditing={false}
              onEdit={() => undefined}
              onCancel={() => undefined}
              onSave={() => undefined}
              saving={false}
            />
          )}
        </dl>
      </section>

      <AdminRestaurantMembershipSettings
        restaurant={restaurant}
        onAdjustMembership={async (businessId, days) => {
          const updated = await extendAdminRestaurantMembership(businessId, days)
          setRestaurant(updated)
          return updated
        }}
        onUpdate={async (businessId, payload) => {
          const updated = await updateAdminRestaurant(businessId, payload)
          setRestaurant(updated)
          return updated
        }}
      />

      <AdminJewelerFeatureSettings
        restaurant={restaurant}
        onUpdate={async (payload) => {
          setFeatureError(null)
          try {
            const updated = await updateAdminRestaurantFeatures(restaurant.id, payload)
            setRestaurant(updated)
          } catch (submitError) {
            setFeatureError(getApiErrorMessage(submitError, 'Modül ayarları kaydedilemedi.'))
            throw submitError
          }
        }}
      />

      {featureError && <p className="alert-error">{featureError}</p>}

      <div className="flex justify-end">
        <Button type="button" variant="danger" disabled={deleting} onClick={() => void handleDelete()}>
          {deleting ? 'Siliniyor...' : 'İşletmeyi Sil'}
        </Button>
      </div>
    </div>
  )
}

function getFieldValue(restaurant: RestaurantListItem, field: EditableField): string {
  switch (field) {
    case 'name':
      return restaurant.name
    case 'contact_person':
      return restaurant.contact_person ?? ''
    case 'phone':
      return restaurant.phone ?? ''
    case 'address':
      return restaurant.address ?? ''
    case 'email':
      return restaurant.email
    case 'password':
      return ''
  }
}
