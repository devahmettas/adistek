import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import Card from '../../components/Card'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import StatsBarChart from '../../components/jeweler/StatsBarChart'
import JewelryCashTransactionModal from '../../components/jeweler/JewelryCashTransactionModal'
import JewelryCashSessionOpenModal from '../../components/jeweler/JewelryCashSessionOpenModal'
import JewelryCashSessionCloseModal from '../../components/jeweler/JewelryCashSessionCloseModal'
import {
  getJewelryCashSessions,
  getJewelryVaultOverview,
  type JewelryCashSessionSummary,
  type JewelryVaultCategory,
  type JewelryVaultCashTransaction,
  type JewelryVaultOverview,
} from '../../api/jeweler'
import { formatJewelryMoney } from '../../utils/jewelryPrice'
import {
  DEFAULT_HISTORY_PERIOD,
  HISTORY_PERIOD_OPTIONS,
  isWithinPeriod,
  type SalesPeriodFilter,
} from '../../utils/jewelrySalesAnalytics'
import { formatPanelMoney, PanelStatCard } from '../../components/restaurant/ManagementPanelWidgets'

export default function JewelerVaultPage() {
  const [overview, setOverview] = useState<JewelryVaultOverview | null>(null)
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null)
  const [transactionPeriod, setTransactionPeriod] = useState<SalesPeriodFilter>(DEFAULT_HISTORY_PERIOD)
  const [transactionSearch, setTransactionSearch] = useState('')
  const [cashModalType, setCashModalType] = useState<'in' | 'out' | null>(null)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [sessionHistory, setSessionHistory] = useState<JewelryCashSessionSummary[]>([])
  const [editingTransaction, setEditingTransaction] = useState<JewelryVaultCashTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, sessions] = await Promise.all([
        getJewelryVaultOverview(),
        getJewelryCashSessions(),
      ])
      setOverview(data)
      setSessionHistory(sessions)
      setExpandedCategoryId((current) => (
        current !== null && data.categories.some((category) => category.category_id === current)
          ? current
          : null
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

  const filteredCashTransactions = useMemo(() => {
    if (!overview) {
      return []
    }

    const query = transactionSearch.trim().toLocaleLowerCase('tr-TR')

    return overview.cash_transactions
      .filter((transaction) => {
        if (!transaction.created_at || !isWithinPeriod(transaction.created_at, transactionPeriod)) {
          return false
        }

        if (!query) {
          return true
        }

        const haystack = [
          transaction.type_label,
          transaction.source_label,
          transaction.notes,
          transaction.sale_number,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('tr-TR')

        return haystack.includes(query)
      })
      .sort((left, right) => (
        new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime()
      ))
  }, [overview, transactionPeriod, transactionSearch])

  const filteredCashSummary = useMemo(() => {
    let totalIn = 0
    let totalOut = 0

    for (const transaction of filteredCashTransactions) {
      const amount = Number(transaction.amount) || 0
      if (transaction.type === 'in') {
        totalIn += amount
      } else {
        totalOut += amount
      }
    }

    return {
      count: filteredCashTransactions.length,
      totalIn: Math.round(totalIn * 100) / 100,
      totalOut: Math.round(totalOut * 100) / 100,
      net: Math.round((totalIn - totalOut) * 100) / 100,
    }
  }, [filteredCashTransactions])

  const hasTransactionFilters = (
    transactionPeriod !== DEFAULT_HISTORY_PERIOD
    || transactionSearch.trim() !== ''
  )

  const resetTransactionFilters = () => {
    setTransactionPeriod(DEFAULT_HISTORY_PERIOD)
    setTransactionSearch('')
  }

  const toggleCategory = (categoryId: number) => {
    setExpandedCategoryId((current) => (current === categoryId ? null : categoryId))
  }

  const cashSession = overview?.cash_session
  const isCashOpen = cashSession?.is_open ?? false
  const activeSession = cashSession?.active_session ?? null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kasa Yönetimi"
        description="Gün sonu ve kasa açılışı ile nakit hareketlerini güvenle yönetin."
      />

      {overview && cashSession && (
        <CashSessionBanner
          isOpen={isCashOpen}
          session={activeSession}
          currentBalance={cashSession.current_cash_balance}
          onOpen={() => setShowOpenModal(true)}
          onClose={() => setShowCloseModal(true)}
        />
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          size="lg"
          className="w-full py-4 text-base"
          onClick={() => setCashModalType('in')}
          disabled={!isCashOpen}
        >
          Nakit Girişi
        </Button>
        <Button
          type="button"
          variant="danger"
          size="lg"
          className="w-full py-4 text-base"
          onClick={() => setCashModalType('out')}
          disabled={!isCashOpen}
        >
          Nakit Çıkışı
        </Button>
      </section>

      {!isCashOpen && overview && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Kasa kapalı. Nakit işlem, nakit satış ve nakit alım yapabilmek için önce kasa açılışı yapın.
        </p>
      )}

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
            title={`Nakit İşlemleri (${filteredCashTransactions.length})`}
            description="Manuel giriş/çıkışlar ve nakit satışlardan oluşan hareketler"
          >
            <div className="mb-4 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 sm:p-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <input
                  type="search"
                  placeholder="Açıklama, satış no..."
                  value={transactionSearch}
                  onChange={(event) => setTransactionSearch(event.target.value)}
                  className="input-field h-9 min-w-0 flex-1 px-3 text-sm"
                />
                <div className="flex flex-wrap items-center gap-1">
                  {HISTORY_PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTransactionPeriod(option.value)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        transactionPeriod === option.value
                          ? 'bg-brand-700 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  {hasTransactionFilters && (
                    <button
                      type="button"
                      onClick={resetTransactionFilters}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                <span>
                  Giriş: <strong className="text-emerald-700">{formatPanelMoney(filteredCashSummary.totalIn)}</strong>
                </span>
                <span>
                  Çıkış: <strong className="text-red-600">{formatPanelMoney(filteredCashSummary.totalOut)}</strong>
                </span>
                <span>
                  Net: <strong className="text-slate-900">{formatPanelMoney(filteredCashSummary.net)}</strong>
                </span>
              </div>
            </div>

            {filteredCashTransactions.length > 0 ? (
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
                    {filteredCashTransactions.map((transaction) => (
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
                {overview.cash_transactions.length === 0
                  ? 'Henüz nakit işlemi yok. Nakit girişi ekleyebilir veya nakit satış yaptığınızda otomatik kayıt oluşur.'
                  : 'Seçili döneme uygun nakit işlemi bulunamadı.'}
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
                    onSelect={() => toggleCategory(category.category_id)}
                  />
                ))}
              </div>

              {selectedCategory ? (
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
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-center text-sm text-slate-500">
                  Ürünleri görmek için bir kategori seçin.
                </p>
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

          {sessionHistory.length > 0 && (
            <Card
              title="Gün sonu geçmişi"
              description="Son kasa açılış ve kapanış kayıtları"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2">Tarih</th>
                      <th className="px-3 py-2">Durum</th>
                      <th className="px-3 py-2 text-right">Açılış</th>
                      <th className="px-3 py-2 text-right">Beklenen</th>
                      <th className="px-3 py-2 text-right">Sayılan</th>
                      <th className="px-3 py-2 text-right">Fark</th>
                      <th className="px-3 py-2 text-right">Satış</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessionHistory.map((session) => (
                      <SessionHistoryRow key={session.id} session={session} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {showOpenModal && cashSession && (
        <JewelryCashSessionOpenModal
          status={cashSession}
          onClose={() => setShowOpenModal(false)}
          onSuccess={() => void load()}
        />
      )}

      {showCloseModal && activeSession && (
        <JewelryCashSessionCloseModal
          session={activeSession}
          onClose={() => setShowCloseModal(false)}
          onSuccess={() => void load()}
        />
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

function CashSessionBanner({
  isOpen,
  session,
  currentBalance,
  onOpen,
  onClose,
}: {
  isOpen: boolean
  session: JewelryVaultOverview['cash_session']['active_session']
  currentBalance: number
  onOpen: () => void
  onClose: () => void
}) {
  if (isOpen && session) {
    const openedLabel = session.opened_at
      ? new Date(session.opened_at).toLocaleString('tr-TR')
      : '—'

    return (
      <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 px-6 py-6 text-white shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                Kasa Açık
              </span>
              <span className="text-sm text-emerald-100">Açılış: {openedLabel}</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight">
              {formatPanelMoney(session.expected_balance ?? session.opening_balance)}
            </p>
            <p className="mt-2 text-sm text-emerald-100">
              Açılış {formatPanelMoney(session.opening_balance)} · Giriş {formatPanelMoney(session.session_cash_in)} · Çıkış {formatPanelMoney(session.session_cash_out)}
            </p>
            <p className="mt-1 text-sm text-emerald-100">
              Nakit satış: {session.cash_sale_count} · Sistem bakiyesi: {formatPanelMoney(currentBalance)}
            </p>
          </div>
          <Button type="button" variant="danger" size="lg" onClick={onClose}>
            Gün Sonu Al
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 px-6 py-6 text-white shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
            Kasa Kapalı
          </span>
          <p className="mt-3 text-2xl font-bold tracking-tight">Güne başlamak için kasa açılışı yapın</p>
          <p className="mt-2 text-sm text-slate-300">
            Önerilen açılış bakiyesi sistemde {formatPanelMoney(currentBalance)} olarak görünüyor.
          </p>
        </div>
        <Button type="button" size="lg" onClick={onOpen}>
          Kasa Açılışı Yap
        </Button>
      </div>
    </section>
  )
}

function SessionHistoryRow({ session }: { session: JewelryCashSessionSummary }) {
  const dateLabel = session.closed_at
    ? new Date(session.closed_at).toLocaleString('tr-TR')
    : session.opened_at
      ? new Date(session.opened_at).toLocaleString('tr-TR')
      : '—'

  const difference = session.cash_difference
  const differenceClass = difference === null
    ? 'text-slate-500'
    : Math.abs(difference) < 0.01
      ? 'text-emerald-700'
      : difference < 0
        ? 'text-red-700'
        : 'text-amber-700'

  return (
    <tr>
      <td className="px-3 py-3 text-slate-700">{dateLabel}</td>
      <td className="px-3 py-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          session.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
        }`}
        >
          {session.status_label}
        </span>
      </td>
      <td className="px-3 py-3 text-right text-slate-700">{formatPanelMoney(session.opening_balance)}</td>
      <td className="px-3 py-3 text-right text-slate-700">
        {session.expected_balance !== null ? formatPanelMoney(session.expected_balance) : '—'}
      </td>
      <td className="px-3 py-3 text-right text-slate-700">
        {session.counted_balance !== null ? formatPanelMoney(session.counted_balance) : '—'}
      </td>
      <td className={`px-3 py-3 text-right font-semibold ${differenceClass}`}>
        {difference !== null ? formatPanelMoney(difference) : '—'}
      </td>
      <td className="px-3 py-3 text-right text-slate-700">{formatPanelMoney(session.cash_sale_total)}</td>
    </tr>
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
