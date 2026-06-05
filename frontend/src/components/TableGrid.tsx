import { useState } from 'react'
import type { Category, Product, RestaurantTable } from '../api/types'
import {
  TABLE_STATUS_LABELS,
  TABLE_STATUS_STYLES,
  type TableStatus,
} from '../constants/tableStatuses'
import {
  formatOccupiedDuration,
  getTableItemCount,
  getTableTotalAmount,
} from '../utils/tableHelpers'
import TableDetailModal from './TableDetailModal'

interface TableGridProps {
  tables: RestaurantTable[]
  categories: Category[]
  products: Product[]
  now: number
  onAddProduct: (
    tableId: number,
    productId: number,
    quantity?: number,
    note?: string,
  ) => Promise<void>
  onUpdateProduct: (
    tableId: number,
    productId: number,
    payload: { quantity: number; note?: string | null },
  ) => Promise<void>
  onRequestBill: (tableId: number) => Promise<void>
  onPayBill: (tableId: number) => Promise<void>
}

export default function TableGrid({
  tables,
  categories,
  products,
  now,
  onAddProduct,
  onUpdateProduct,
  onRequestBill,
  onPayBill,
}: TableGridProps) {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)

  if (tables.length === 0) {
    return <p className="text-sm text-gray-500">Henüz masa eklenmemiş.</p>
  }

  const activeTable = selectedTable
    ? tables.find((table) => table.id === selectedTable.id) ?? selectedTable
    : null

  return (
    <>
      <p className="mb-4 text-sm text-gray-500">
        Masayı açmak için karta tıklayın. Ürün ekleyin veya hesap isteyin.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tables.map((table) => {
          const status = (table.status || 'empty') as TableStatus
          const styles = TABLE_STATUS_STYLES[status] ?? TABLE_STATUS_STYLES.empty
          const total = getTableTotalAmount(table.products)
          const duration = formatOccupiedDuration(table.occupied_at ?? null, now)
          const itemCount = getTableItemCount(table.products)

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => setSelectedTable(table)}
              className={`flex aspect-square flex-col justify-between rounded-2xl border-2 p-4 text-left shadow-sm transition hover:scale-[1.02] hover:shadow-md ${styles.card}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{table.name}</h3>
                  <span className={`h-3 w-3 shrink-0 rounded-full ${styles.dot}`} />
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles.badge}`}
                >
                  {TABLE_STATUS_LABELS[status]}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-base font-bold text-blue-700">{total.toFixed(2)} ₺</p>
                <p className="text-xs text-gray-600">{duration ?? 'Boş masa'}</p>
                <p className="text-xs text-gray-500">
                  {itemCount > 0 ? `${itemCount} ürün` : 'Ürün yok'}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {activeTable && (
        <TableDetailModal
          table={activeTable}
          categories={categories}
          products={products}
          now={now}
          onClose={() => setSelectedTable(null)}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onRequestBill={onRequestBill}
          onPayBill={async (tableId) => {
            await onPayBill(tableId)
            setSelectedTable(null)
          }}
        />
      )}
    </>
  )
}
