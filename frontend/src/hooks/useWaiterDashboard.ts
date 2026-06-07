import { useCallback, useEffect, useState } from 'react'
import { getCategories } from '../api/categories'
import { getProducts } from '../api/products'
import {
  addProductToTable,
  acknowledgeKitchenReady,
  cancelTableItem,
  claimTableView,
  closeTable,
  getTables,
  updateTableItem,
  updateTableStatus,
} from '../api/tables'
import waiterClient, { WAITER_TOKEN_KEY } from '../api/waiterClient'
import type { Category, Product, RestaurantTable } from '../api/types'
import type { TableStatus } from '../constants/tableStatuses'

export default function useWaiterDashboard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const patchTable = useCallback((updatedTable: RestaurantTable) => {
    setTables((prev) =>
      prev.map((table) => (table.id === updatedTable.id ? updatedTable : table)),
    )
  }, [])

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const [categoryData, productData, tableData] = await Promise.all([
        getCategories(waiterClient),
        getProducts(waiterClient),
        getTables(waiterClient),
      ])
      setCategories(categoryData)
      setProducts(productData)
      setTables(tableData)
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status
        if (status === 401) {
          localStorage.removeItem(WAITER_TOKEN_KEY)
          window.location.href = '/waiter/login'
          return
        }
      }
      if (!silent) {
        setError('Veriler yüklenemedi. Backend çalışıyor mu kontrol edin.')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchData(true)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [fetchData])

  const assignProductToTable = useCallback(
    async (tableId: number, productId: number, quantity = 1, note?: string) => {
      const updatedTable = await addProductToTable(
        tableId,
        {
          product_id: productId,
          quantity,
          note: note?.trim() || undefined,
        },
        waiterClient,
      )
      patchTable(updatedTable)
    },
    [patchTable],
  )

  const updateTableProductQuantity = useCallback(
    async (
      tableId: number,
      pivotId: number,
      payload: {
        quantity: number
        note?: string | null
      },
    ) => {
      const updatedTable = await updateTableItem(tableId, pivotId, payload, waiterClient)
      patchTable(updatedTable)
    },
    [patchTable],
  )

  const cancelTableProduct = useCallback(
    async (tableId: number, pivotId: number) => {
      const updatedTable = await cancelTableItem(tableId, pivotId, waiterClient)
      patchTable(updatedTable)
    },
    [patchTable],
  )

  const requestTableBill = useCallback(
    async (tableId: number) => {
      const updatedTable = await updateTableStatus(tableId, 'bill_requested', waiterClient)
      patchTable(updatedTable)
    },
    [patchTable],
  )

  const payTableBill = useCallback(
    async (tableId: number) => {
      const updatedTable = await closeTable(tableId, waiterClient)
      patchTable(updatedTable)
    },
    [patchTable],
  )

  const claimView = useCallback(
    async (tableId: number) => {
      const updatedTable = await claimTableView(tableId, waiterClient)
      patchTable(updatedTable)
    },
    [patchTable],
  )

  const changeTableStatus = useCallback(
    async (tableId: number, status: TableStatus) => {
      const updatedTable = await updateTableStatus(tableId, status, waiterClient)
      patchTable(updatedTable)
    },
    [patchTable],
  )

  const acknowledgeKitchen = useCallback(
    async (tableId: number) => {
      const updatedTable = await acknowledgeKitchenReady(tableId, waiterClient)
      patchTable(updatedTable)
      return updatedTable
    },
    [patchTable],
  )

  return {
    categories,
    products,
    tables,
    loading,
    error,
    assignProductToTable,
    updateTableProductQuantity,
    cancelTableProduct,
    changeTableStatus,
    requestTableBill,
    payTableBill,
    claimView,
    acknowledgeKitchen,
    refresh: fetchData,
  }
}
