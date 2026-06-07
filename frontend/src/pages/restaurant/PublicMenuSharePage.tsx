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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Müşteri Menüsü</h1>
        <p className="mt-1 text-sm text-gray-600">
          Müşterileriniz bu linkten kategorileri ve ürünleri görebilir. Giriş gerekmez.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
        <p className="text-sm font-medium text-amber-900">Menü linki</p>
        {menuUrl ? (
          <>
            <p className="mt-2 break-all rounded-xl bg-white px-4 py-3 text-sm text-gray-800 ring-1 ring-amber-100">
              {menuUrl}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={menuPath ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
              >
                Menüyü Önizle
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
              >
                Linki Kopyala
              </button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Restoran bilgisi yüklenemedi.</p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
        <p className="font-medium text-gray-900">Menüde görünenler</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Yalnızca aktif ürünler listelenir</li>
          <li>Ürünü olmayan kategoriler gizlenir</li>
          <li>Fiyat ve açıklamalar müşteriye açık şekilde gösterilir</li>
        </ul>
      </div>
    </div>
  )
}
