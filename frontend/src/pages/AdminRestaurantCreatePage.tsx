import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminJewelerModuleFields from '../components/admin/AdminJewelerModuleFields'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import PageHeader from '../components/PageHeader'
import Textarea from '../components/Textarea'
import useAdminRestaurants from '../hooks/useAdminRestaurants'
import { getApiErrorMessage } from '../utils/adminDashboard'

export default function AdminRestaurantCreatePage() {
  const navigate = useNavigate()
  const { addRestaurant } = useAdminRestaurants()

  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [serviceFee, setServiceFee] = useState('0')
  const [membershipDays, setMembershipDays] = useState('30')
  const [modules, setModules] = useState({
    feature_jeweler_barcode: true,
    feature_jeweler_reports: true,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)

    try {
      await addRestaurant({
        name: name.trim(),
        business_type: 'jeweler',
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim(),
        password,
        service_fee: Number.parseFloat(serviceFee.replace(',', '.')) || 0,
        membership_days: Number.parseInt(membershipDays, 10) || 30,
        feature_jeweler_barcode: modules.feature_jeweler_barcode,
        feature_jeweler_reports: modules.feature_jeweler_reports,
      })

      navigate('/admin/restaurants/list')
    } catch (submitError) {
      setFormError(getApiErrorMessage(submitError, 'Kuyumcu işletmesi eklenemedi.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kuyumcu Ekle"
        description="Yeni kuyumcu işletmesini sisteme kaydedin. İşletme sahibi verdiğiniz e-posta ve şifre ile panele giriş yapabilir."
        actions={
          <Link
            to="/admin/restaurants/list"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Geri Dön
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card title="İşletme Bilgileri">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <Input
              label="İşletme Adı"
              name="businessName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Örn: Altın Dünyası Kuyumculuk"
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
              placeholder="kuyumcu@ornek.com"
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
            <Input
              label="Aylık Hizmet Bedeli (₺)"
              name="serviceFee"
              type="number"
              min={0}
              step="0.01"
              value={serviceFee}
              onChange={(event) => setServiceFee(event.target.value)}
              placeholder="Örn: 1500"
            />
            <Input
              label="Başlangıç Üyelik Süresi (gün)"
              name="membershipDays"
              type="number"
              min={1}
              max={3650}
              value={membershipDays}
              onChange={(event) => setMembershipDays(event.target.value)}
              placeholder="Örn: 30"
              required
            />

            <div className="md:col-span-2">
              <AdminJewelerModuleFields value={modules} onChange={setModules} />
            </div>

            {formError && <p className="alert-error md:col-span-2">{formError}</p>}

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : 'Kuyumcuyu Kaydet'}
              </Button>
              <Link
                to="/admin/restaurants/list"
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
              <li>Üyelik süresi dolunca işletme giriş yapamaz; süper admin gün ekleyerek yeniler.</li>
              <li>Seçtiğiniz modüller işletme panelinde aktif olur.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-slate-900">Zorunlu alanlar</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Yetkili kişi, telefon ve adres bilgileri admin panelinde görünür; işletme yönetimi
              için iletişim kaydı olarak saklanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
