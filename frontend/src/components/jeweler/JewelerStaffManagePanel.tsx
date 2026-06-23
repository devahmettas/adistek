import { useEffect, useState } from 'react'
import {
  deleteJewelerStaff,
  getJewelerStaff,
  updateJewelerStaff,
  type JewelerStaffMember,
} from '../../api/jewelerStaff'
import Button from '../Button'
import Card from '../Card'
import {
  JEWELER_PERMISSION_LABELS,
  type JewelerPermissionKey,
} from '../../constants/jewelerPermissions'
import JewelerStaffAddModal from './JewelerStaffAddModal'
import JewelerStaffEditModal from './JewelerStaffEditModal'

export default function JewelerStaffManagePanel() {
  const [staff, setStaff] = useState<JewelerStaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<JewelerStaffMember | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setStaff(await getJewelerStaff())
    } catch {
      setError('Personel listesi yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const toggleActive = async (member: JewelerStaffMember) => {
    try {
      await updateJewelerStaff(member.id, { is_active: !member.is_active })
      await load()
    } catch {
      window.alert('Durum güncellenemedi.')
    }
  }

  const removeStaff = async (member: JewelerStaffMember) => {
    if (!window.confirm(`${member.name} silinsin mi?`)) {
      return
    }

    try {
      await deleteJewelerStaff(member.id)
      if (editingMember?.id === member.id) {
        setEditingMember(null)
      }
      await load()
    } catch {
      window.alert('Personel silinemedi.')
    }
  }

  return (
    <>
      <Card
        title="Personel Listesi"
        description="Kayıtlı çalışanları görüntüleyin ve yönetin."
      >
        <div className="mb-4 flex justify-end">
          <Button type="button" size="sm" onClick={() => setShowAddModal(true)}>
            + Personel Ekle
          </Button>
        </div>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-slate-500">Personel yükleniyor...</p>
        ) : staff.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
            <p className="text-sm text-slate-600">Henüz personel eklenmemiş.</p>
            <Button type="button" className="mt-4" onClick={() => setShowAddModal(true)}>
              İlk Personeli Ekle
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Ad</th>
                  <th className="px-3 py-2">E-posta</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2">Yetkiler</th>
                  <th className="px-3 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-3 py-3 font-medium text-slate-900">{member.name}</td>
                    <td className="px-3 py-3 text-slate-700">{member.email}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                      >
                        {member.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {(Object.keys(member.permissions) as JewelerPermissionKey[])
                        .filter((key) => member.permissions[key])
                        .map((key) => JEWELER_PERMISSION_LABELS[key])
                        .join(', ') || 'Temel erişim'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingMember(member)}>
                          Düzenle
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => void toggleActive(member)}>
                          {member.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                        </Button>
                        <Button type="button" variant="danger" size="sm" onClick={() => void removeStaff(member)}>
                          Sil
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAddModal && (
        <JewelerStaffAddModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => void load()}
        />
      )}

      {editingMember && (
        <JewelerStaffEditModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onUpdated={() => void load()}
        />
      )}
    </>
  )
}
