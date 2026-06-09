import { FormEvent, useEffect, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import MenuSlidesManager from '../../components/MenuSlidesManager'
import PageHeader from '../../components/PageHeader'
import Textarea from '../../components/Textarea'
import { getMenuSettings, updateMenuSettings } from '../../api/menuSettings'
import { useAuth } from '../../store/AuthStore'

export default function PublicMenuSharePage() {
  const { restaurant } = useAuth()
  const [tagline, setTagline] = useState('')
  const [welcomeText, setWelcomeText] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)

  const menuPath = restaurant?.slug
    ? `/menu/${restaurant.slug}`
    : restaurant?.id
      ? `/menu/${restaurant.id}`
      : null
  const menuUrl = menuPath ? `${window.location.origin}${menuPath}` : null

  useEffect(() => {
    getMenuSettings()
      .then((settings) => {
        setTagline(settings.menu_tagline ?? '')
        setWelcomeText(settings.menu_welcome_text ?? '')
      })
      .catch(() => {
        setSettingsError('Menü ayarları yüklenemedi.')
      })
      .finally(() => {
        setSettingsLoading(false)
      })
  }, [])

  const copyLink = async () => {
    if (!menuUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(menuUrl)
      window.alert('Menü linki kopyalandı.')
    } catch {
      window.prompt('Menü linkini kopyalayın:', menuUrl)
    }
  }

  const handleSettingsSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSettingsSaving(true)
    setSettingsError(null)
    setSettingsMessage(null)

    try {
      await updateMenuSettings({
        menu_tagline: tagline.trim() || null,
        menu_welcome_text: welcomeText.trim() || null,
      })
      setSettingsMessage('Menü görünüm ayarları kaydedildi.')
    } catch {
      setSettingsError('Menü ayarları kaydedilemedi.')
    } finally {
      setSettingsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteri Menüsü"
        description="QR menü görünümünü, slaytları ve paylaşım linkini buradan yönetin."
      />

      <div className="panel-surface overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-br from-brand-50 to-white px-6 py-5">
          <p className="text-sm font-semibold text-brand-900">Menü linki</p>
          {menuUrl ? (
            <>
              <p className="mt-2 break-all rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800">
                {menuUrl}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={menuPath ?? '#'} target="_blank" rel="noreferrer">
                  <Button>Menüyü Önizle</Button>
                </a>
                <Button type="button" variant="secondary" onClick={copyLink}>
                  Linki Kopyala
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Restoran bilgisi yüklenemedi.</p>
          )}
        </div>

        <div className="px-6 py-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Menüde görünenler</p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              Üst slayt alanı, ürün görselleri, kalori ve alerjen ikonları
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              Yalnızca aktif ürünler listelenir
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              Ürünü olmayan kategoriler gizlenir
            </li>
          </ul>
        </div>
      </div>

      <Card
        title="Menü Görünüm Ayarları"
        description="Müşteri menüsündeki başlık altı metinleri özelleştirin."
      >
        {settingsLoading ? (
          <p className="text-sm text-slate-500">Ayarlar yükleniyor...</p>
        ) : (
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <Input
              label="Kısa Slogan"
              name="menuTagline"
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              placeholder="Örn: Taze malzemeler, özenli sunum"
            />
            <Textarea
              label="Karşılama Metni"
              name="menuWelcomeText"
              rows={3}
              value={welcomeText}
              onChange={(event) => setWelcomeText(event.target.value)}
              placeholder="Müşterilerinize kısa bir hoş geldiniz mesajı yazın."
            />
            {settingsError && <p className="text-sm text-red-600">{settingsError}</p>}
            {settingsMessage && <p className="text-sm text-emerald-700">{settingsMessage}</p>}
            <Button type="submit" disabled={settingsSaving}>
              {settingsSaving ? 'Kaydediliyor...' : 'Görünüm Ayarlarını Kaydet'}
            </Button>
          </form>
        )}
      </Card>

      <Card
        title="Menü Slaytları"
        description="QR menü üstünde dönen kampanya ve vitrin görsellerini yönetin."
      >
        <MenuSlidesManager />
      </Card>
    </div>
  )
}
