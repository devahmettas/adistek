import { useEffect, useRef, useState, type MouseEvent } from 'react'
import type { Category, Product, RestaurantTable } from '../api/types'
import type { PaymentMethod } from '../constants/paymentMethods'
import type { PartialPayItem } from '../utils/billHelpers'
import { TABLE_STATUS_STYLES, type TableStatus } from '../constants/tableStatuses'
import {
  EMPTY_TABLE_BLOCKED_MESSAGE,
  formatOccupiedDuration,
  getReadyKitchenItemCount,
  getTableItemCount,
  getTableTotalAmount,
  getTableWaiterName,
  hasUnpaidTableOrders,
} from '../utils/tableHelpers'
import TableDetailModal from './TableDetailModal'
import TableStatusPicker, { TableStatusBadge } from './TableStatusPicker'

interface TableGridProps {
  tables: RestaurantTable[]
  categories: Category[]
  products: Product[]
  now: number
  isWaiter?: boolean
  onAddProduct: (
    tableId: number,
    productId: number,
    quantity?: number,
    note?: string,
  ) => Promise<void>
  onUpdateProduct: (
    tableId: number,
    pivotId: number,
    payload: { quantity: number; note?: string | null },
  ) => Promise<void>
  onCancelProduct: (tableId: number, pivotId: number) => Promise<void>
  onChangeStatus?: (tableId: number, status: TableStatus) => Promise<void>
  onRequestBill: (tableId: number) => Promise<void>
  onPayBill: (tableId: number, paymentMethod: PaymentMethod) => Promise<void>
  onPartialPayBill: (
    tableId: number,
    paymentMethod: PaymentMethod,
    items: PartialPayItem[],
  ) => Promise<{ table: RestaurantTable; message: string }>
  onClaimView?: (tableId: number) => Promise<void>
  onAcknowledgeKitchen?: (tableId: number) => Promise<RestaurantTable | void>
  showKitchenAlerts?: boolean
}

export default function TableGrid({
  tables,
  categories,
  products,
  now,
  isWaiter = false,
  onAddProduct,
  onUpdateProduct,
  onCancelProduct,
  onChangeStatus,
  onRequestBill,
  onPayBill,
  onPartialPayBill,
  onClaimView,
  onAcknowledgeKitchen,
  showKitchenAlerts = false,
}: TableGridProps) {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [statusMenuTableId, setStatusMenuTableId] = useState<number | null>(null)
  const onClaimViewRef = useRef(onClaimView)
  const onAcknowledgeKitchenRef = useRef(onAcknowledgeKitchen)

  useEffect(() => {
    onClaimViewRef.current = onClaimView
  }, [onClaimView])

  useEffect(() => {
    onAcknowledgeKitchenRef.current = onAcknowledgeKitchen
  }, [onAcknowledgeKitchen])

  const openTable = async (table: RestaurantTable) => {
    if (isWaiter && onClaimViewRef.current) {
      try {
        await onClaimViewRef.current(table.id)
      } catch {
        // Modal still opens even if claim fails.
      }
    }

    let tableToOpen = table

    if (showKitchenAlerts && getReadyKitchenItemCount(table.products) > 0) {
      try {
        const updated = await onAcknowledgeKitchenRef.current?.(table.id)
        if (updated) {
          tableToOpen = updated
        }
      } catch {
        // Keep modal open even if acknowledge fails.
      }
    }

    setSelectedTable(tableToOpen)
  }

  const closeTable = () => {
    setSelectedTable(null)
  }

  const handleStatusClick = (event: MouseEvent, tableId: number) => {
    event.stopPropagation()

    if (!onChangeStatus) {
      return
    }

    setStatusMenuTableId((current) => (current === tableId ? null : tableId))
  }

  const handleStatusChange = async (tableId: number, status: TableStatus) => {
    if (!onChangeStatus) {
      return
    }

    const table = tables.find((row) => row.id === tableId)

    if (status === 'empty' && table && hasUnpaidTableOrders(table.products)) {
      window.alert(EMPTY_TABLE_BLOCKED_MESSAGE)
      setStatusMenuTableId(null)
      return
    }

    try {
      await onChangeStatus(tableId, status)
      setStatusMenuTableId(null)
    } catch {
      window.alert('Masa durumu güncellenemedi. Ödenmemiş sipariş varsa önce hesabı kapatın.')
    }
  }

  const handleBlockedStatus = (_status: TableStatus, message: string) => {
    window.alert(message)
    setStatusMenuTableId(null)
  }

  useEffect(() => {
    if (!isWaiter || !selectedTable) {
      return
    }

    const tableId = selectedTable.id
    const heartbeat = window.setInterval(() => {
      onClaimViewRef.current?.(tableId).catch(() => undefined)
    }, 30000)

    return () => window.clearInterval(heartbeat)
  }, [isWaiter, selectedTable?.id])

  if (tables.length === 0) {
    return <p className="text-sm text-gray-500">Henüz masa eklenmemiş.</p>
  }

  const activeTable = selectedTable
    ? tables.find((table) => table.id === selectedTable.id) ?? selectedTable
    : null

  return (
    <>
      <p className="mb-4 text-sm text-gray-500">
        {isWaiter
          ? 'Masayı açmak için karta tıklayın. Durumu değiştirmek için rozetine tıklayın.'
          : 'Masayı açmak için karta tıklayın. Mutfak hazır bildirimi kartta görünür. İlk siparişi alan garson sorumlu olarak listelenir.'}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tables.map((table) => {
          const status = (table.status || 'empty') as TableStatus
          const styles = TABLE_STATUS_STYLES[status] ?? TABLE_STATUS_STYLES.empty
          const total = getTableTotalAmount(table.products)
          const duration = formatOccupiedDuration(table.occupied_at ?? null, now)
          const itemCount = getTableItemCount(table.products)
          const waiterName = getTableWaiterName(table)
          const readyCount = getReadyKitchenItemCount(table.products)

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => openTable(table)}
              className={`relative flex aspect-square flex-col justify-between rounded-2xl border-2 p-4 text-left shadow-sm transition hover:scale-[1.02] hover:shadow-md ${styles.card}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold text-gray-900">{table.name}</p>
                    <p
                      className={`mt-1 truncate rounded-md px-2 py-0.5 text-xs font-semibold ${
                        waiterName
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {waiterName ? `Sorumlu: ${waiterName}` : 'Garson atanmadı'}
                    </p>
                  </div>
                  <span className={`h-3 w-3 shrink-0 rounded-full ${styles.dot}`} />
                </div>
                <div className="relative">
                  <TableStatusBadge
                    status={status}
                    onClick={onChangeStatus ? (event) => handleStatusClick(event, table.id) : undefined}
                  />
                  {statusMenuTableId === table.id && onChangeStatus && (
                    <TableStatusPicker
                      status={status}
                      onChange={(nextStatus) => handleStatusChange(table.id, nextStatus)}
                      onClose={() => setStatusMenuTableId(null)}
                      blockedStatuses={
                        itemCount > 0 ? { empty: EMPTY_TABLE_BLOCKED_MESSAGE } : undefined
                      }
                      onBlockedStatus={handleBlockedStatus}
                    />
                  )}
                </div>
              </div>

              {showKitchenAlerts && readyCount > 0 && (
                <p className="animate-pulse rounded-lg bg-emerald-500 px-2 py-1 text-center text-xs font-bold text-white">
                  {readyCount} ürün hazır!
                </p>
              )}

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
          onClose={closeTable}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onCancelProduct={onCancelProduct}
          onChangeStatus={onChangeStatus}
          onRequestBill={onRequestBill}
          onPayBill={async (tableId, paymentMethod) => {
            await onPayBill(tableId, paymentMethod)
            closeTable()
          }}
          onPartialPayBill={onPartialPayBill}
        />
      )}
    </>
  )
}
