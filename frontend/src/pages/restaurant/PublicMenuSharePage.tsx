import Button from '../../components/Button'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../store/AuthStore'

export default function PublicMenuSharePage() {
  const { restaurant } = useAuth()
  const menuPath = restaurant?.slug
    ? `/menu/${restaurant.slug}`
    : restaurant?.id
      ? `/menu/${restaurant.id}`
      : null
  const menuUrl = menuPath ? `${window.location.origin}${menuPath}` : null

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteri Menüsü"
        description="Müşterileriniz bu linkten menünüzü görüntüleyebilir. Giriş gerekmez."
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
              Yalnızca aktif ürünler listelenir
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              Ürünü olmayan kategoriler gizlenir
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              Fiyat ve açıklamalar müşteriye açık şekilde gösterilir
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
