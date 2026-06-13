import {
  formatJewelryMoney,
  type JewelryCartTotals,
  type JewelrySaleProfitSummary,
} from '../../utils/jewelryPrice'

interface JewelrySaleProfitBreakdownProps {
  summary: Pick<
    JewelrySaleProfitSummary,
    'grossProfit' | 'cardCommission' | 'additionalTax' | 'totalProfit' | 'profitMarginPercent'
  >
  paymentMethod: string
  compact?: boolean
}

export function JewelrySaleProfitBreakdown({
  summary,
  paymentMethod,
  compact = false,
}: JewelrySaleProfitBreakdownProps) {
  const textSize = compact ? 'text-xs' : 'text-sm'
  const profitPositive = summary.totalProfit >= 0

  return (
    <dl className={`space-y-1.5 ${textSize}`}>
      {(summary.cardCommission > 0 || summary.additionalTax > 0) && (
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Brüt kar</dt>
          <dd className={`font-medium ${summary.grossProfit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {formatJewelryMoney(summary.grossProfit)}
          </dd>
        </div>
      )}
      {paymentMethod === 'card' && summary.cardCommission > 0 && (
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Kart komisyonu</dt>
          <dd className="font-medium text-orange-700">-{formatJewelryMoney(summary.cardCommission)}</dd>
        </div>
      )}
      {summary.additionalTax > 0 && (
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Ek vergi</dt>
          <dd className="font-medium text-orange-700">-{formatJewelryMoney(summary.additionalTax)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-3 border-t border-slate-200/80 pt-1.5">
        <dt className="font-semibold text-slate-900">Net kar</dt>
        <dd className={`font-bold ${profitPositive ? 'text-emerald-700' : 'text-red-600'}`}>
          {formatJewelryMoney(summary.totalProfit)}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-slate-500">Kar marjı</dt>
        <dd className={`font-semibold ${profitPositive ? 'text-emerald-700' : 'text-red-600'}`}>
          %{summary.profitMarginPercent.toLocaleString('tr-TR')}
        </dd>
      </div>
    </dl>
  )
}

export function JewelryCartProfitBreakdown({
  totals,
  paymentMethod,
}: {
  totals: Pick<
    JewelryCartTotals,
    'grossProfit' | 'cardCommission' | 'additionalTax' | 'totalProfit' | 'profitMarginPercent'
  >
  paymentMethod: string
}) {
  return (
    <JewelrySaleProfitBreakdown
      summary={totals}
      paymentMethod={paymentMethod}
      compact
    />
  )
}
