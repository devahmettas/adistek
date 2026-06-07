import { FormEvent, useState } from 'react'
import type { RestaurantTable } from '../api/types'
import Button from './Button'
import Input from './Input'
import { TABLE_STATUS_LABELS } from '../constants/tableStatuses'

interface TableListProps {
  tables: RestaurantTable[]
  onUpdate: (tableId: number, name: string) => Promise<void>
  onDelete: (tableId: number) => Promise<void>
}

export default function TableList({ tables, onUpdate, onDelete }: TableListProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (table: RestaurantTable) => {
    setEditingId(table.id)
    setEditName(table.name)
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setError(null)
  }

  const handleSave = async (event: FormEvent, tableId: number) => {
    event.preventDefault()
    setError(null)

    if (!editName.trim()) {
      setError('Masa adı zorunludur.')
      return
    }

    setSubmittingId(tableId)

    try {
      await onUpdate(tableId, editName.trim())
      cancelEdit()
    } catch {
      setError('Masa güncellenemedi.')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleDelete = async (table: RestaurantTable) => {
    if (!window.confirm(`${table.name} silinsin mi?`)) {
      return
    }

    setSubmittingId(table.id)
    setError(null)

    try {
      await onDelete(table.id)
    } catch (err) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Masa silinemedi. Masanın boş olduğundan emin olun.'
      setError(message)
    } finally {
      setSubmittingId(null)
    }
  }

  if (tables.length === 0) {
    return <p className="text-sm text-gray-500">Henüz masa eklenmemiş.</p>
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-gray-100">
        {tables.map((table) => {
          const isEditing = editingId === table.id
          const isEmpty = table.status === 'empty'

          return (
            <li key={table.id} className="py-4">
              {isEditing ? (
                <form
                  onSubmit={(event) => handleSave(event, table.id)}
                  className="flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                  <div className="flex-1">
                    <Input
                      label="Masa Adı"
                      name={`editTable-${table.id}`}
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submittingId === table.id}>
                      {submittingId === table.id ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={cancelEdit}>
                      Vazgeç
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{table.name}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Durum: {TABLE_STATUS_LABELS[table.status] ?? table.status}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => startEdit(table)}
                      disabled={submittingId === table.id}
                    >
                      Düzenle
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleDelete(table)}
                      disabled={submittingId === table.id || !isEmpty}
                      className="text-red-700 hover:bg-red-50 disabled:opacity-50"
                      title={isEmpty ? undefined : 'Silmek için masa boş olmalı'}
                    >
                      Sil
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-gray-500">
        Yalnızca boş masalar silinebilir. Dolu masayı silmeden önce hesabı kapatın.
      </p>
    </div>
  )
}
