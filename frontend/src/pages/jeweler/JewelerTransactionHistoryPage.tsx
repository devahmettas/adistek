import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import JewelerPurchaseHistorySection from '../../components/jeweler/JewelerPurchaseHistorySection'
import JewelerSalesSection from '../../components/jeweler/JewelerSalesSection'

type HistoryTab = 'sales' | 'purchases'

function parseTab(value: string | null): HistoryTab {
  return value === 'purchases' ? 'purchases' : 'sales'
}

const TABS: Array<{ value: HistoryTab; label: string }> = [
  { value: 'sales', label: 'Satış Geçmişi' },
  { value: 'purchases', label: 'Alım Geçmişi' },
]

export default function JewelerTransactionHistoryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('tab'))

  const setTab = (nextTab: HistoryTab) => {
    if (nextTab === 'sales') {
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ tab: 'purchases' }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="İşlem Geçmişi"
        description="Geçmiş satış ve alım kayıtlarını filtreleyin, detaylarını inceleyin."
        actions={(
          <Link
            to={tab === 'purchases' ? '/dashboard/jeweler/purchases' : '/dashboard/jeweler/purchases?mode=sale'}
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-800"
          >
            Yeni işlem
          </Link>
        )}
      />

      <div
        role="tablist"
        aria-label="Geçmiş türü"
        className="inline-flex w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm sm:w-auto"
      >
        {TABS.map((option) => {
          const active = tab === option.value

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(option.value)}
              className={`min-w-0 flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:min-w-[9rem] ${
                active
                  ? 'bg-white text-brand-800 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {tab === 'sales' ? <JewelerSalesSection /> : (
        <JewelerPurchaseHistorySection
          onEdit={(purchase) => navigate(`/dashboard/jeweler/purchases?edit=${purchase.id}`)}
        />
      )}
    </div>
  )
}
