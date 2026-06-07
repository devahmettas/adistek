export type TableStatus =
  | 'empty'
  | 'occupied'
  | 'waiting_order'
  | 'ordered'
  | 'served'
  | 'bill_requested'
  | 'reserved'

export const TABLE_STATUSES: TableStatus[] = [
  'empty',
  'occupied',
  'waiting_order',
  'ordered',
  'served',
  'bill_requested',
  'reserved',
]

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  empty: 'Boş',
  occupied: 'Dolu',
  waiting_order: 'Sipariş Vermedi',
  ordered: 'Sipariş Verildi',
  served: 'Teslim Edildi',
  bill_requested: 'Hesap İstendi',
  reserved: 'Rezerve',
}

export const TABLE_STATUS_STYLES: Record<
  TableStatus,
  { card: string; badge: string; dot: string }
> = {
  empty: {
    card: 'border-green-200 bg-green-50',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
  },
  occupied: {
    card: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
  },
  waiting_order: {
    card: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  ordered: {
    card: 'border-purple-200 bg-purple-50',
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-500',
  },
  served: {
    card: 'border-teal-200 bg-teal-50',
    badge: 'bg-teal-100 text-teal-800',
    dot: 'bg-teal-500',
  },
  bill_requested: {
    card: 'border-rose-200 bg-rose-50',
    badge: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
  },
  reserved: {
    card: 'border-slate-200 bg-slate-50',
    badge: 'bg-slate-100 text-slate-700',
    dot: 'bg-slate-500',
  },
}
