import { FormEvent, useCallback, useEffect, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import Textarea from '../../components/Textarea'
import { createJewelryRepair, getJewelryRepairs, updateJewelryRepair, type JewelryRepair } from '../../api/jeweler'

const STATUS_LABELS: Record<string, string> = {
  received: 'Teslim Alındı',
  in_progress: 'İşlemde',
  completed: 'Tamamlandı',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
}

export default function JewelerRepairsPage() {
  const [repairs, setRepairs] = useState<JewelryRepair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRepairs(await getJewelryRepairs())
    } catch {
      setError('Tamir kayıtları yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await createJewelryRepair({
        item_description: description.trim(),
        estimated_cost: estimatedCost || null,
        metal_type: 'gold',
        karat: 22,
      })
      setDescription('')
      setEstimatedCost('')
      await load()
    } catch {
      setError('Tamir kaydı oluşturulamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  const advanceStatus = async (repair: JewelryRepair) => {
    const next =
      repair.status === 'received'
        ? 'in_progress'
        : repair.status === 'in_progress'
          ? 'completed'
          : repair.status === 'completed'
            ? 'delivered'
            : repair.status

    try {
      await updateJewelryRepair(repair.id, { status: next })
      await load()
    } catch {
      setError('Durum güncellenemedi.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tamir Takibi" description="Müşteri tamir işlerini yönetin" />
      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Yeni Tamir Kaydı">
          <form onSubmit={handleSubmit} className="grid gap-3">
            <Textarea label="Ürün Açıklaması" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
            <Input label="Tahmini Ücret (₺)" type="number" step="0.01" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
            <Button type="submit" disabled={submitting}>{submitting ? 'Kaydediliyor...' : 'Tamir Kaydı Oluştur'}</Button>
          </form>
        </Card>

        <Card title={`Tamir Listesi (${repairs.length})`}>
          <ul className="divide-y divide-slate-100">
            {repairs.map((repair) => (
              <li key={repair.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">#{repair.repair_number}</p>
                    <p className="text-sm text-slate-700">{repair.item_description}</p>
                    <p className="text-xs text-slate-500">
                      {STATUS_LABELS[repair.status] ?? repair.status} · {new Date(repair.received_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  {repair.status !== 'delivered' && repair.status !== 'cancelled' && (
                    <button type="button" onClick={() => void advanceStatus(repair)} className="text-xs font-semibold text-brand-700 hover:underline">
                      İlerlet
                    </button>
                  )}
                </div>
              </li>
            ))}
            {repairs.length === 0 && !loading && (
              <li className="py-6 text-center text-sm text-slate-500">Henüz tamir kaydı yok.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
