import { FormEvent, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import TableList from '../../components/TableList'
import { useDashboardData } from '../../context/DashboardContext'

export default function TablesManagePage() {
  const { tables, loading, error, addTable, editTable, removeTable } = useDashboardData()
  const [tableName, setTableName] = useState('')
  const [tableError, setTableError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTableError(null)

    if (!tableName.trim()) {
      setTableError('Masa adı zorunludur.')
      return
    }

    setSubmitting(true)

    try {
      await addTable(tableName.trim())
      setTableName('')
    } catch {
      setTableError('Masa eklenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Masa Ayarları</h1>
        <p className="mt-1 text-sm text-gray-600">
          Restoran masalarını ekleyin, her masa için QR kod oluşturun ve müşterilerin doğrudan sipariş vermesini sağlayın.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && (
        <>
          <Card title="Masa Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Masa Adı"
                name="tableName"
                value={tableName}
                onChange={(event) => setTableName(event.target.value)}
                placeholder="Örn: Masa 1"
              />
              {tableError && <p className="text-sm text-red-600">{tableError}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : 'Masa Ekle'}
              </Button>
            </form>
          </Card>

          <Card title="Kayıtlı Masalar">
            <TableList tables={tables} onUpdate={editTable} onDelete={removeTable} />
          </Card>
        </>
      )}
    </div>
  )
}
