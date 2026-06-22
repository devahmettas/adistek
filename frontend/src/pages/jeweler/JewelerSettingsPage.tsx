import { FormEvent, useCallback, useEffect, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import { getJewelrySettings, updateJewelrySettings, type JewelrySettings } from '../../api/jeweler'
import JewelerFeatureDisabledNotice from '../../components/jeweler/JewelerFeatureDisabledNotice'
import { useJewelerFeatures } from '../../hooks/useJewelerFeatures'

export default function JewelerSettingsPage() {
  const { barcodeEnabled } = useJewelerFeatures()
  const [settings, setSettings] = useState<JewelrySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSettings(await getJewelrySettings())
    } catch {
      setError('Ayarlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!settings) return
    setSubmitting(true)
    try {
      const updated = await updateJewelrySettings({
        default_karat: settings.default_karat,
        tax_rate: settings.tax_rate,
        card_commission_rate: settings.card_commission_rate,
        barcode_prefix: settings.barcode_prefix,
        company_name: settings.company_name,
        receipt_footer: settings.receipt_footer,
        auto_generate_barcode: settings.auto_generate_barcode,
      })
      setSettings(updated)
    } catch {
      setError('Ayarlar kaydedilemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState />
  if (!settings) return <p className="alert-error">{error ?? 'Ayarlar bulunamadı.'}</p>

  return (
    <div className="space-y-6">
      <PageHeader title="Ayarlar" description="Kuyumcu panel yapılandırması" />
      {error && <p className="alert-error">{error}</p>}

      <Card title="Satış & Karlılık">
        <form onSubmit={handleSubmit} className="grid max-w-lg gap-4">
          <Input
            label="Kart Komisyonu (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={settings.card_commission_rate ?? '0'}
            onChange={(e) => setSettings({ ...settings, card_commission_rate: e.target.value })}
          />
          <p className="-mt-2 text-xs text-slate-500">
            Kart ile ödeme seçildiğinde satış tutarından düşülür ve net kar buna göre hesaplanır.
          </p>
          <Input
            label="Ek Vergi (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={settings.tax_rate}
            onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
          />
          <p className="-mt-2 text-xs text-slate-500">
            Tüm satışlarda tahsilat üzerinden ek maliyet olarak kar marjı hesabına yansır.
          </p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </form>
      </Card>

      <Card title="Genel Ayarlar">
        <form onSubmit={handleSubmit} className="grid max-w-lg gap-4">
          <Input
            label="Varsayılan Ayar"
            type="number"
            value={String(settings.default_karat)}
            onChange={(e) => setSettings({ ...settings, default_karat: Number(e.target.value) })}
          />
          {barcodeEnabled ? (
            <>
              <Input
                label="Barkod Öneki"
                value={settings.barcode_prefix ?? ''}
                onChange={(e) => setSettings({ ...settings, barcode_prefix: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={settings.auto_generate_barcode}
                  onChange={(e) => setSettings({ ...settings, auto_generate_barcode: e.target.checked })}
                />
                Otomatik barkod oluştur
              </label>
            </>
          ) : (
            <div className="md:col-span-2">
              <JewelerFeatureDisabledNotice feature="barcode" compact />
            </div>
          )}
          <Input
            label="Firma Adı"
            value={settings.company_name ?? ''}
            onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
          />
          <Input
            label="Fiş Alt Bilgi"
            value={settings.receipt_footer ?? ''}
            onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
