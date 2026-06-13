import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import GoldPriceChart from '../../components/jeweler/GoldPriceChart'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import {
  getMarketGoldPriceHistory,
  getMarketGoldPricesLive,
  syncMarketGoldPrices,
  type MarketGoldPriceLatestResponse,
  type MarketGoldPriceRecord,
  type MarketGoldPriceType,
} from '../../api/jeweler'

const HISTORY_REFRESH_MS = 30_000
const LIVE_POLL_MS = 400
const LOCAL_CACHE_KEY = 'adistek_gold_prices_v1'
const DISPLAY_TIMEZONE = 'Europe/Istanbul'

const GOLD_TYPE_OPTIONS: Array<{ value: MarketGoldPriceType; label: string }> = [
  { value: 'ayar_22', label: '22 Ayar' },
  { value: 'ayar_18', label: '18 Ayar' },
  { value: 'ayar_14', label: '14 Ayar' },
  { value: 'ayar_8', label: '8 Ayar' },
  { value: 'gram_altin', label: 'Gram Altın' },
  { value: 'cumhuriyet_altini', label: 'Ata Altın' },
  { value: 'eski_ceyrek_altin', label: 'Eski Çeyrek' },
  { value: 'ceyrek_altin', label: 'Yeni Çeyrek' },
  { value: 'eski_yarim_altin', label: 'Eski Yarım' },
  { value: 'yarim_altin', label: 'Yeni Yarım' },
  { value: 'eski_ziynet', label: 'Eski Ziynet' },
  { value: 'tam_altin', label: 'Yeni Ziynet' },
  { value: 'paketli_has', label: 'Paketli Has' },
  { value: 'ayar_24', label: 'Has Altın' },
]

const PERIOD_OPTIONS = [
  { value: '24h', label: '24 Saat' },
  { value: '7d', label: '7 Gün' },
  { value: '30d', label: '30 Gün' },
] as const

function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return `${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
}

function formatTurkeyDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleString('tr-TR', {
    timeZone: DISPLAY_TIMEZONE,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function normalizePriceType(type: unknown): MarketGoldPriceType | null {
  if (typeof type === 'string') {
    return GOLD_TYPE_OPTIONS.some((option) => option.value === type)
      ? (type as MarketGoldPriceType)
      : null
  }

  if (type && typeof type === 'object' && 'value' in type) {
    const value = (type as { value?: unknown }).value
    return typeof value === 'string' ? normalizePriceType(value) : null
  }

  return null
}

function normalizePrices(prices: MarketGoldPriceRecord[] | undefined): MarketGoldPriceRecord[] {
  if (!prices?.length) {
    return []
  }

  const byType = new Map<MarketGoldPriceType, MarketGoldPriceRecord>()

  for (const price of prices) {
    const type = normalizePriceType(price.type)

    if (!type || price.cash_sell_price === null || price.cash_sell_price === undefined || price.cash_sell_price === '') {
      continue
    }

    byType.set(type, {
      ...price,
      type,
      name: price.name || GOLD_TYPE_OPTIONS.find((option) => option.value === type)?.label || type,
    })
  }

  return GOLD_TYPE_OPTIONS
    .map((option) => byType.get(option.value))
    .filter((price): price is MarketGoldPriceRecord => Boolean(price))
}

function pricesSignature(
  prices: MarketGoldPriceRecord[],
  hasGoldBase?: number | null,
): string {
  const base = hasGoldBase ?? 'na'

  return `${base}|${normalizePrices(prices)
    .map((price) => `${price.type}:${price.cash_sell_price}:${price.card_sell_price}`)
    .join('|')}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function readLocalCache(): MarketGoldPriceLatestResponse | null {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as MarketGoldPriceLatestResponse
    return parsed.prices?.length ? parsed : null
  } catch {
    return null
  }
}

function writeLocalCache(data: MarketGoldPriceLatestResponse): void {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data))
  } catch {
    // localStorage dolu veya devre dışı
  }
}

function buildInitialState(): {
  latest: MarketGoldPriceLatestResponse | null
  version: number
  signature: string | null
} {
  const cached = readLocalCache()

  if (!cached) {
    return { latest: null, version: 0, signature: null }
  }

  const prices = normalizePrices(cached.prices)

  return {
    latest: { ...cached, prices },
    version: cached.version ?? 0,
    signature: pricesSignature(prices, cached.has_gold_base),
  }
}

export default function JewelerGoldPricesPage() {
  const initialState = useMemo(() => buildInitialState(), [])
  const [latest, setLatest] = useState<MarketGoldPriceLatestResponse | null>(initialState.latest)
  const [selectedType, setSelectedType] = useState<MarketGoldPriceType>('ayar_22')
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h')
  const [chartPoints, setChartPoints] = useState<Array<{
    fetched_at: string
    cash_sell_price: number
    card_sell_price: number | null
  }>>([])
  const [loading, setLoading] = useState(!initialState.latest)
  const [chartLoading, setChartLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [listening, setListening] = useState(false)
  const [justUpdated, setJustUpdated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nowLabel, setNowLabel] = useState(formatTurkeyDateTime(new Date().toISOString()))
  const [lastDisplayedAt, setLastDisplayedAt] = useState<string | null>(null)
  const [hasGoldBase, setHasGoldBase] = useState<number | null>(null)

  const activeRef = useRef(true)
  const versionRef = useRef(initialState.version)
  const previousSignature = useRef<string | null>(initialState.signature)
  const flashTimer = useRef<number | null>(null)
  const pollInFlightRef = useRef(false)

  const applyLiveData = useCallback((data: MarketGoldPriceLatestResponse, options?: { silent?: boolean }) => {
    if (!data.prices?.length) {
      return
    }

    const normalizedPrices = normalizePrices(data.prices)
    const signature = pricesSignature(normalizedPrices, data.has_gold_base)

    if (typeof data.version === 'number') {
      versionRef.current = data.version
    }

    setLatest({
      ...data,
      prices: normalizedPrices,
    })
    setNowLabel(formatTurkeyDateTime(data.server_time))
    setLastDisplayedAt(data.last_sync_at ?? data.server_time)
    setHasGoldBase(data.has_gold_base ?? null)

    if (
      !options?.silent
      && previousSignature.current !== null
      && previousSignature.current !== signature
    ) {
      setJustUpdated(true)
      if (flashTimer.current) {
        window.clearTimeout(flashTimer.current)
      }
      flashTimer.current = window.setTimeout(() => setJustUpdated(false), 1500)
    }

    previousSignature.current = signature
    writeLocalCache({
      ...data,
      prices: normalizedPrices,
    })
  }, [])

  const pollLiveOnce = useCallback(async (): Promise<void> => {
    if (pollInFlightRef.current) {
      return
    }

    pollInFlightRef.current = true

    try {
      const data = await getMarketGoldPricesLive(versionRef.current)

      if (!activeRef.current) {
        return
      }

      if (typeof data.version === 'number') {
        versionRef.current = data.version
      }

      if (data.prices?.length) {
        applyLiveData(data)
        setError(null)
        setListening(true)
      }
    } catch {
      if (activeRef.current) {
        setError('Bağlantı yeniden kuruluyor...')
      }
    } finally {
      pollInFlightRef.current = false
    }
  }, [applyLiveData])

  const startLivePoll = useCallback(async () => {
    setListening(true)

    while (activeRef.current) {
      await pollLiveOnce()
      await sleep(LIVE_POLL_MS)
    }

    setListening(false)
  }, [pollLiveOnce])

  const loadHistory = useCallback(async () => {
    setChartLoading(true)
    try {
      const history = await getMarketGoldPriceHistory(selectedType, period)
      setChartPoints(history.points)
    } catch {
      setChartPoints([])
    } finally {
      setChartLoading(false)
    }
  }, [period, selectedType])

  useEffect(() => {
    activeRef.current = true

    const cached = readLocalCache()
    if (cached) {
      applyLiveData(cached, { silent: true })
      setLoading(false)
    } else {
      setLoading(true)
    }

    void pollLiveOnce().finally(() => {
      setLoading(false)
    })
    void startLivePoll()

    const historyTimer = window.setInterval(() => {
      void loadHistory()
    }, HISTORY_REFRESH_MS)

    const clockTimer = window.setInterval(() => {
      setNowLabel(formatTurkeyDateTime(new Date().toISOString()))
    }, 1000)

    return () => {
      activeRef.current = false
      window.clearInterval(historyTimer)
      window.clearInterval(clockTimer)
      if (flashTimer.current) {
        window.clearTimeout(flashTimer.current)
      }
    }
  }, [applyLiveData, loadHistory, pollLiveOnce, startLivePoll])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const handleManualSync = async () => {
    setSyncing(true)
    setError(null)

    try {
      await syncMarketGoldPrices()
      const data = await getMarketGoldPricesLive()
      applyLiveData(data)
      await loadHistory()
    } catch {
      setError('Fiyat güncellenemedi.')
    } finally {
      setSyncing(false)
    }
  }

  const pricesByType = useMemo(() => {
    const map = new Map<MarketGoldPriceType, MarketGoldPriceRecord>()

    for (const price of latest?.prices ?? []) {
      map.set(price.type, price)
    }

    return map
  }, [latest])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Altın Fiyatları"
        description="İZKO ile senkron — yalnızca fiyat değişince güncellenir"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <span className={`h-2 w-2 rounded-full bg-emerald-500 ${listening ? 'animate-pulse' : ''}`} />
              {listening ? 'Canlı dinleme' : 'Bağlanıyor'}
            </span>
            <Button type="button" onClick={() => void handleManualSync()} disabled={syncing}>
              {syncing ? 'Güncelleniyor...' : 'Şimdi Güncelle'}
            </Button>
          </div>
        }
      />

      {loading && <LoadingState label="Fiyatlar yükleniyor..." />}
      {error && <p className="alert-error">{error}</p>}

      {latest && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm transition-colors duration-300 ${
            justUpdated
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <p>
            Kaynak: <strong>{latest.source}</strong>
            {' · '}
            Akış: <strong>{latest.stream_source ?? 'ozbag'}</strong>
            {hasGoldBase !== null && (
              <>
                {' · '}
                Has altın: <strong>{formatMoney(hasGoldBase)}</strong>
              </>
            )}
            {justUpdated && (
              <span className="ml-2 rounded-full bg-emerald-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-900">
                Fiyat güncellendi
              </span>
            )}
          </p>
          <p className="mt-1 text-xs opacity-90">
            Anlık saat (Türkiye): <strong>{nowLabel}</strong>
            {' · '}
            Son veri: <strong>{formatTurkeyDateTime(lastDisplayedAt)}</strong>
            {' · '}
            Güncelleme: fiyat değişince anında
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-card">
        <p className="font-semibold text-slate-900">Fiyat türleri ne anlama geliyor?</p>
        <ul className="mt-2 space-y-1 text-sm leading-relaxed text-slate-600">
          <li>
            <strong>N. Satış (Nakit Satış):</strong> Müşterinin nakit veya havale/EFT ile ödediği fiyattır.
          </li>
          <li>
            <strong>K.K Satış (Kredi Kartı Satış):</strong> Müşterinin kredi kartı veya banka kartı ile ödediği
            fiyattır. Kart komisyonu (%5) eklendiği için nakit satıştan genelde daha yüksektir.
          </li>
          <li>
            <strong>Has Altın / Paketli Has:</strong> Ozbag canlı akışı ile anlık güncellenir. Diğer türler İZKO ile
            aynı anda, has 5 TL hareket edince yenilenir.
          </li>
        </ul>
      </div>

      <Card title="Güncel Fiyatlar">
        <div
          className={`overflow-x-auto rounded-xl transition-all duration-300 ${
            justUpdated ? 'ring-2 ring-emerald-300 shadow-emerald-100' : ''
          }`}
        >
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Ürün</th>
                <th className="px-3 py-2">Nakit Satış (N.)</th>
                <th className="px-3 py-2">Kredi Kartı (K.K)</th>
                <th className="px-3 py-2">Kayıt Saati (TR)</th>
              </tr>
            </thead>
            <tbody>
              {GOLD_TYPE_OPTIONS.map((option) => {
                const price = pricesByType.get(option.value)

                return (
                  <tr
                    key={option.value}
                    className={`border-b border-slate-100 transition-colors duration-300 ${
                      justUpdated ? 'bg-emerald-50/70' : ''
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-slate-900">{price?.name ?? option.label}</td>
                    <td className="px-3 py-3 font-semibold text-brand-700">{formatMoney(price?.cash_sell_price)}</td>
                    <td className="px-3 py-3 text-slate-700">{formatMoney(price?.card_sell_price)}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {formatTurkeyDateTime(price?.fetched_at)}
                    </td>
                  </tr>
                )
              })}
              {pricesByType.size === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    Fiyatlar yükleniyor...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Fiyat Grafiği">
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as MarketGoldPriceType)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {GOLD_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  period === option.value
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {chartLoading ? <LoadingState label="Grafik yükleniyor..." /> : <GoldPriceChart points={chartPoints} />}
      </Card>
    </div>
  )
}
