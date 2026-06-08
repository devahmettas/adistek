import { FormEvent, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
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
      <PageHeader
        title="Masa Ayarları"
        description="Masalarınızı tanımlayın, QR kodlarını oluşturun ve müşteri sipariş akışını yönetin."
      />

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

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
              {tableError && <p className="alert-error">{tableError}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : 'Masa Ekle'}
              </Button>
            </form>
          </Card>

          <Card title="Kayıtlı Masalar" description="Her masa için sabit QR kodu oluşturulur.">
            <TableList tables={tables} onUpdate={editTable} onDelete={removeTable} />
          </Card>
        </>
      )}
    </div>
  )
}
