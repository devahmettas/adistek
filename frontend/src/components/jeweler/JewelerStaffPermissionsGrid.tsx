import type { JewelerPermissionCatalogItem } from '../../api/jewelerStaff'
import {
  JEWELER_PERMISSION_DEFAULTS,
  JEWELER_PERMISSION_LABELS,
  type JewelerPermissionKey,
  type JewelerPermissionMap,
} from '../../constants/jewelerPermissions'

interface JewelerStaffPermissionsGridProps {
  permissions: JewelerPermissionMap
  catalog: JewelerPermissionCatalogItem[]
  onToggle: (key: JewelerPermissionKey) => void
  hint?: string
}

export default function JewelerStaffPermissionsGrid({
  permissions,
  catalog,
  onToggle,
  hint = 'Kasa, kazanç ve dashboard erişimini personel bazında açıp kapatabilirsiniz.',
}: JewelerStaffPermissionsGridProps) {
  const permissionItems = catalog.length > 0
    ? catalog
    : (Object.keys(JEWELER_PERMISSION_LABELS) as JewelerPermissionKey[]).map((key) => ({
        key,
        label: JEWELER_PERMISSION_LABELS[key],
        default: JEWELER_PERMISSION_DEFAULTS[key],
      }))

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-900">Yetkilendirme</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {permissionItems.map((item) => (
          <label
            key={item.key}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={permissions[item.key]}
              onChange={() => onToggle(item.key)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium text-slate-900">{item.label}</span>
              {!item.default && (
                <span className="mt-0.5 block text-xs text-slate-500">
                  Varsayılan: kapalı
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  )
}
