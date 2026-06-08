import type { KitchenOrderItem } from '../../api/types'
import Button from '../Button'

interface KitchenOrderItemCardProps {
  item: KitchenOrderItem
  submitting: boolean
  onMarkReady: (pivotId: number) => void
  onDismissCancelled: (pivotId: number) => void
}

export default function KitchenOrderItemCard({
  item,
  submitting,
  onMarkReady,
  onDismissCancelled,
}: KitchenOrderItemCardProps) {
  const isReady = item.kitchen_status === 'ready'
  const isCancelled = item.kitchen_status === 'cancelled'
  const isPending = item.kitchen_status === 'pending'

  return (
    <article
      className={`rounded-xl border p-4 transition ${
        isCancelled
          ? 'border-red-200 bg-red-50/80'
          : isReady
            ? 'border-emerald-200 bg-emerald-50/80'
            : 'border-amber-200 bg-amber-50/50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {isPending && (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                Hazırlanıyor
              </span>
            )}
            {isReady && (
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                Hazır
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
                İptal
              </span>
            )}
            {item.quantity > 1 && (
              <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg bg-slate-800 px-2 py-0.5 text-sm font-bold text-white">
                x{item.quantity}
              </span>
            )}
          </div>

          <h3
            className={`text-lg font-bold leading-tight text-slate-900 ${
              isCancelled
                ? 'line-through decoration-red-400'
                : isReady
                  ? 'line-through decoration-emerald-400'
                  : ''
            }`}
          >
            {item.product_name}
          </h3>

          {item.description && (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
          )}

          {item.note && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                Sipariş notu
              </p>
              <p className="mt-1 text-sm font-medium text-amber-900">{item.note}</p>
            </div>
          )}
        </div>

        <div className="shrink-0">
          {isCancelled ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onDismissCancelled(item.pivot_id)}
              disabled={submitting}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              {submitting ? '...' : 'Gördüm'}
            </Button>
          ) : isReady ? (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white shadow-sm"
              aria-label="Hazır"
            >
              ✓
            </div>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={() => onMarkReady(item.pivot_id)}
              disabled={submitting}
              className="min-w-[6.5rem] bg-emerald-600 px-5 hover:bg-emerald-700"
            >
              {submitting ? '...' : 'Hazır'}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
