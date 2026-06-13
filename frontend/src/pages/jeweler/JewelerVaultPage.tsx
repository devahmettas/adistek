import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import Card from '../../components/Card'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import StatsBarChart from '../../components/jeweler/StatsBarChart'
import JewelryCashTransactionModal from '../../components/jeweler/JewelryCashTransactionModal'
import {
  getJewelryVaultOverview,
  type JewelryVaultCategory,
  type JewelryVaultCashTransaction,
  type JewelryVaultOverview,
} from '../../api/jeweler'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import { formatPanelMoney, PanelStatCard } from '../../components/restaurant/ManagementPanelWidgets'

export default function JewelerVaultPage() {
  const [overview, setOverview] = useState<JewelryVaultOverview | null>(null)
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null)
  const [cashModalType, setCashModalType] = useState<'in' | 'out' | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<JewelryVaultCashTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getJewelryVaultOverview()
      setOverview(data)
      setExpandedCategoryId((current) => (
        current !== null && data.categories.some((category) => category.category_id === current)
          ? current
          : data.categories[0]?.category_id ?? null
      ))
    } catch {
      setError('Kasa bilgileri yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const chartItems = useMemo(
    () => (overview?.categories ?? []).map((category) => ({
      label: category.category_name,
      value: category.total_value,
      hint: `${category.stock_units} adet`,
    })),
    [overview],
  )

  const selectedCategory = useMemo(
    () => overview?.categories.find((category) => category.category_id === expandedCategoryId) ?? null,
    [overview, expandedCategoryId],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kasa Yönetimi"
        description="Ürün kategorilerine göre stok takibi ve nakit işlemleri. Stok değerleri ürün yönetiminden, nakit hareketleri buradan yönetilir."
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          size="lg"
          className="w-full py-4 text-base"
          onClick={() => setCashModalType('in')}
        >
          Nakit Girişi
        </Button>
        <Button
          type="button"
          variant="danger"
          size="lg"
          className="w-full py-4 text-base"
          onClick={() => setCashModalType('out')}
        >
          Nakit Çıkışı
        </Button>
      </section>

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {overview && (
        <>
          <section className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 px-6 py-7 text-white shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Toplam Kasa Değeri</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">{formatPanelMoney(overview.grand_total)}</p>
            <p className="mt-2 text-sm text-amber-100">
              Stok: {formatPanelMoney(overview.stock_total)} · Nakit: {formatPanelMoney(overview.cash.balance)}
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PanelStatCard
              label="Nakit bakiye"
              value={formatPanelMoney(overview.cash.balance)}
              hint={`${overview.cash.transaction_count} işlem`}
              accent="emerald"
            />
            <PanelStatCard
              label="Nakit giriş"
              value={formatPanelMoney(overview.cash.total_in)}
              hint="Toplam giriş"
              accent="brand"
            />
            <PanelStatCard
              label="Nakit çıkış"
              value={formatPanelMoney(overview.cash.total_out)}
              hint="Toplam çıkış"
              accent="amber"
            />
            <PanelStatCard
              label="Stok değeri"
              value={formatPanelMoney(overview.stock_total)}
              hint={`${overview.category_count} kategori`}
              accent="violet"
            />
          </section>

          <Card
            title="Nakit İşlemleri"
            description="Manuel giriş/çıkışlar ve nakit satışlardan oluşan hareketler"
          >
            {overview.cash_transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2">Tarih</th>
                      <th className="px-3 py-2">Tür</th>
                      <th className="px-3 py-2">Kaynak</th>
                      <th className="px-3 py-2">Açıklama</th>
                      <th className="px-3 py-2 text-right">Tutar</th>
                      <th className="px-3 py-2 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.cash_transactions.map((transaction) => (
                      <CashTransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        onEdit={transaction.source === 'manual'
                          ? () => setEditingTransaction(transaction)
                          : undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Henüz nakit işlemi yok. Nakit girişi ekleyebilir veya nakit satış yaptığınızda otomatik kayıt oluşur.
              </p>
            )}
          </Card>

          {overview.categories.length > 0 ? (
            <>
              <StatsBarChart
                title="Kategori bazında stok dağılımı"
                items={chartItems}
                valueFormatter={(value) => formatPanelMoney(value)}
                colorClass="bg-amber-500"
              />

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <PanelStatCard
                  label="Toplam stok adedi"
                  value={String(overview.total_stock_units)}
                  hint="Tüm kategoriler"
                  accent="amber"
                />
                <PanelStatCard
                  label="Toplam gram"
                  value={`${overview.total_gram.toLocaleString('tr-TR')} gr`}
                  hint="Stoktaki ürün gramajı"
                  accent="emerald"
                />
              </section>

              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {overview.categories.map((category) => (
                  <CategoryVaultCard
                    key={category.category_id}
                    category={category}
                    active={expandedCategoryId === category.category_id}
                    onSelect={() => setExpandedCategoryId(category.category_id)}
                  />
                ))}
              </div>

              {selectedCategory && (
                <Card
                  title={`${selectedCategory.category_name} — Ürün Detayı`}
                  description="Kasadaki ürünlerin stok ve değer dökümü"
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2">Ürün</th>
                          <th className="px-3 py-2 text-right">Stok</th>
                          <th className="px-3 py-2 text-right">Gram</th>
                          <th className="px-3 py-2 text-right">Birim fiyat</th>
                          <th className="px-3 py-2 text-right">Stok değeri</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCategory.products.map((product) => (
                          <tr key={product.id}>
                            <td className="px-3 py-3">
                              <p className="font-medium text-slate-900">{product.name}</p>
                              {product.karat && (
                                <p className="text-xs text-slate-500">{product.karat} ayar</p>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-slate-900">
                              {product.stock_quantity}
                            </td>
                            <td className="px-3 py-3 text-right text-slate-700">
                              {product.weight_gram} gr
                            </td>
                            <td className="px-3 py-3 text-right text-slate-700">
                              {formatJewelryMoney(product.sale_price)}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-brand-700">
                              {formatPanelMoney(product.line_value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card title="Stok kaydı bulunamadı">
              <p className="text-sm text-slate-600">
                Stok takibi için önce ürün yönetiminde kategori oluşturup ürünleri ilgili kategoriye eklemeniz gerekir.
                Kategorisiz ürünler stok kasasında görünmez.
              </p>
              <Link to="/dashboard/jeweler/products" className="mt-4 inline-block">
                <Button type="button">Ürün Yönetimine Git</Button>
              </Link>
            </Card>
          )}
        </>
      )}

      {cashModalType && (
        <JewelryCashTransactionModal
          type={cashModalType}
          onClose={() => setCashModalType(null)}
          onSuccess={() => void load()}
        />
      )}

      {editingTransaction && (
        <JewelryCashTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => void load()}
        />
      )}
    </div>
  )
}

function CashTransactionRow({
  transaction,
  onEdit,
}: {
  transaction: JewelryVaultCashTransaction
  onEdit?: () => void
}) {
  const isIn = transaction.type === 'in'
  const description = transaction.notes
    || (transaction.sale_number ? `Satış #${transaction.sale_number}` : '—')

  return (
    <tr>
      <td className="px-3 py-3 text-slate-700">
        {transaction.created_at
          ? new Date(transaction.created_at).toLocaleString('tr-TR')
          : '—'}
      </td>
      <td className="px-3 py-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}
        >
          {transaction.type_label}
        </span>
      </td>
      <td className="px-3 py-3 text-slate-700">{transaction.source_label}</td>
      <td className="px-3 py-3 text-slate-700">{description}</td>
      <td className={`px-3 py-3 text-right font-semibold ${isIn ? 'text-emerald-700' : 'text-red-700'}`}>
        {isIn ? '+' : '-'}{formatPanelMoney(transaction.amount)}
      </td>
      <td className="px-3 py-3 text-right">
        {onEdit && (
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            Düzenle
          </Button>
        )}
      </td>
    </tr>
  )
}

function CategoryVaultCard({
  category,
  active,
  onSelect,
}: {
  category: JewelryVaultCategory
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border p-4 text-left shadow-card transition hover:-translate-y-0.5 ${
        active
          ? 'border-brand-300 bg-brand-50/50 ring-2 ring-brand-200'
          : 'border-slate-200 bg-white hover:border-amber-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-slate-900">{category.category_name}</p>
          <p className="mt-1 text-xs text-slate-500">{category.product_count} ürün çeşidi</p>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          {category.stock_units} adet
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Toplam gram</dt>
          <dd className="font-semibold text-slate-900">{category.total_gram.toLocaleString('tr-TR')} gr</dd>
        </div>
        <div>
          <dt className="text-slate-500">Ort. birim</dt>
          <dd className="font-semibold text-slate-900">{formatPanelMoney(category.average_unit_value)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xl font-bold text-brand-700">{formatPanelMoney(category.total_value)}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">Detay için tıklayın</p>
    </button>
  )
}
