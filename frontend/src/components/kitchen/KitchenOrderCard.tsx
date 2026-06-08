import type { KitchenOrder, KitchenOrderItem } from '../../api/types'

import KitchenOrderItemCard from './KitchenOrderItemCard'

interface KitchenOrderCardProps {
  order: KitchenOrder
  submittingId: number | null
  onMarkReady: (pivotId: number) => void
  onDismissCancelled: (pivotId: number) => void
}

function sortItems(items: KitchenOrderItem[]): KitchenOrderItem[] {
  const priority = { pending: 0, ready: 1, acknowledged: 2, cancelled: 3 }

  return [...items].sort((a, b) => {
    const diff = priority[a.kitchen_status] - priority[b.kitchen_status]
    if (diff !== 0) {
      return diff
    }

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

function countByStatus(items: KitchenOrderItem[], status: KitchenOrderItem['kitchen_status']) {
  return items.filter((item) => item.kitchen_status === status).length
}

export default function KitchenOrderCard({
  order,
  submittingId,
  onMarkReady,
  onDismissCancelled,
}: KitchenOrderCardProps) {
  const sortedItems = sortItems(order.items)
  const pendingCount = countByStatus(order.items, 'pending')
  const readyCount = countByStatus(order.items, 'ready')

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-700">Masa</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{order.table_name}</h2>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              {pendingCount} bekliyor
            </span>
          )}
          {readyCount > 0 && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              {readyCount} hazır
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {order.items.length} kalem
          </span>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {sortedItems.map((item) => (
          <KitchenOrderItemCard
            key={item.pivot_id}
            item={item}
            submitting={submittingId === item.pivot_id}
            onMarkReady={onMarkReady}
            onDismissCancelled={onDismissCancelled}
          />
        ))}
      </div>
    </section>
  )
}
