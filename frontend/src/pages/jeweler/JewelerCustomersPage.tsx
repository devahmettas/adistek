import { FormEvent, useCallback, useEffect, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import { createJewelryCustomer, getJewelryCustomers, type JewelryCustomer } from '../../api/jeweler'

export default function JewelerCustomersPage() {
  const [customers, setCustomers] = useState<JewelryCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCustomers(await getJewelryCustomers())
    } catch {
      setError('Müşteriler yüklenemedi.')
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
      await createJewelryCustomer({ name: name.trim(), phone: phone.trim() || null })
      setName('')
      setPhone('')
      await load()
    } catch {
      setError('Müşteri eklenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Müşteri Yönetimi" description="Müşteri kartlarını oluşturun ve yönetin" />
      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Yeni Müşteri">
          <form onSubmit={handleSubmit} className="grid gap-3">
            <Input label="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button type="submit" disabled={submitting}>{submitting ? 'Kaydediliyor...' : 'Müşteri Ekle'}</Button>
          </form>
        </Card>

        <Card title={`Müşteri Listesi (${customers.length})`}>
          <ul className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <li key={customer.id} className="py-3">
                <p className="font-semibold text-slate-900">{customer.name}</p>
                {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
                {customer.email && <p className="text-xs text-slate-500">{customer.email}</p>}
              </li>
            ))}
            {customers.length === 0 && !loading && (
              <li className="py-6 text-center text-sm text-slate-500">Henüz müşteri yok.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
