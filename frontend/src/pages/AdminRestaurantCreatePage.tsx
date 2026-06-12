import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import PageHeader from '../components/PageHeader'
import Textarea from '../components/Textarea'
import type { BusinessType } from '../constants/businessType'
import { BUSINESS_TYPE_LABELS } from '../constants/businessType'
import useAdminRestaurants from '../hooks/useAdminRestaurants'
import { getApiErrorMessage } from '../utils/adminDashboard'

export default function AdminRestaurantCreatePage() {
  const navigate = useNavigate()
  const { addRestaurant } = useAdminRestaurants()

  const [name, setName] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType>('restaurant')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)

    try {
      await addRestaurant({
        name: name.trim(),
        business_type: businessType,
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim(),
        password,
      })

      navigate('/admin/restaurants')
    } catch (submitError) {
      setFormError(getApiErrorMessage(submitError, 'Restoran eklenemedi.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="İşletme Ekle"
        description="Yeni restoran veya kuyumcu işletmesini sisteme kaydedin. İşletme sahibi verdiğiniz e-posta ve şifre ile panele giriş yapabilir."
        actions={
          <Link
            to="/admin/restaurants"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Geri Dön
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card title="İşletme Bilgileri">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">İşletme Türü</label>
              <select
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value as BusinessType)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {(Object.entries(BUSINESS_TYPE_LABELS) as Array<[BusinessType, string]>).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="İşletme Adı"
              name="restaurantName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={businessType === 'jeweler' ? 'Örn: Altın Dünyası Kuyumculuk' : 'Örn: Adistek Cafe'}
              required
            />
            <Input
              label="Yetkili Kişi"
              name="contactPerson"
              value={contactPerson}
              onChange={(event) => setContactPerson(event.target.value)}
              placeholder="Örn: Ahmet Yılmaz"
              required
            />
            <Input
              label="Telefon"
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Örn: 0532 123 45 67"
              required
            />
            <Input
              label="Giriş E-postası"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="restoran@ornek.com"
              required
            />
            <div className="md:col-span-2">
              <Textarea
                label="Adres"
                name="address"
                rows={4}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Mahalle, sokak, ilçe, il"
                required
              />
            </div>
            <Input
              label="Giriş Şifresi"
              name="password"
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="En az 6 karakter"
              required
            />

            {formError && <p className="alert-error md:col-span-2">{formError}</p>}

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : 'İşletmeyi Kaydet'}
              </Button>
              <Link
                to="/admin/restaurants"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                İptal
              </Link>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
            <p className="text-sm font-semibold text-brand-900">Kayıt sonrası</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-900/80">
              <li>İşletme hemen listeye eklenir.</li>
              <li>İşletme sahibi giriş e-postası ve şifre ile panele girebilir.</li>
              <li>
                {businessType === 'jeweler'
                  ? 'Kuyumcu panelinde ürün, stok, satış ve tamir modülleri açılır.'
                  : 'Kategori, ürün ve masa tanımlarını restoran kendisi yapar.'}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-slate-900">Zorunlu alanlar</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Yetkili kişi, telefon ve adres bilgileri admin panelinde görünür; restoran yönetimi
              için iletişim kaydı olarak saklanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
