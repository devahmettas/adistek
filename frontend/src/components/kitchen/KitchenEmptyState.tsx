export default function KitchenEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-card">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-3xl">
        🍽️
      </div>
      <h2 className="mt-5 text-xl font-bold text-slate-900">Şu an bekleyen sipariş yok</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        Yeni siparişler burada görünür. Sayfa her 5 saniyede bir otomatik yenilenir; yeni
        sipariş geldiğinde sesli bildirim alırsınız.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-800">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        Canlı takip açık
      </div>
    </div>
  )
}
