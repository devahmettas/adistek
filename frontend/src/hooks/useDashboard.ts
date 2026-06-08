import { useCallback, useEffect, useState } from 'react'
import { createCategory, deleteCategory, getCategories, updateCategory } from '../api/categories'
import { createProduct, deleteProduct, getProducts, updateProduct } from '../api/products'
import { createTable, addProductToTable, acknowledgeKitchenReady, cancelTableItem, closeTable, deleteTable, getTables, partialPayTable, updateTable, updateTableItem, updateTableStatus } from '../api/tables'
import { TOKEN_KEY } from '../api/client'
import type { Category, Product, RestaurantTable } from '../api/types'
import type { PaymentMethod } from '../constants/paymentMethods'
import type { PartialPayItem } from '../utils/billHelpers'
import type { TableStatus } from '../constants/tableStatuses'

function mergeTableData(
  incoming: RestaurantTable,
  existing?: RestaurantTable,
): RestaurantTable {
  const assignedWaiterName =
    incoming.assigned_waiter_name ??
    incoming.assigned_waiter?.name ??
    existing?.assigned_waiter_name ??
    existing?.assigned_waiter?.name ??
    null

  return {
    ...incoming,
    is_actively_reserved: incoming.is_actively_reserved ?? existing?.is_actively_reserved ?? false,
    today_reservations: incoming.today_reservations ?? existing?.today_reservations ?? [],
    assigned_waiter_id: incoming.assigned_waiter_id ?? existing?.assigned_waiter_id ?? null,
    assigned_waiter_name: assignedWaiterName,
    assigned_waiter: incoming.assigned_waiter ?? existing?.assigned_waiter ?? null,
    viewing_waiter_id: incoming.viewing_waiter_id ?? existing?.viewing_waiter_id ?? null,
    viewing_waiter_name: incoming.viewing_waiter_name ?? existing?.viewing_waiter_name ?? null,
    viewing_waiter: incoming.viewing_waiter ?? existing?.viewing_waiter ?? null,
  }
}

export default function useDashboard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const [categoryData, productData, tableData] = await Promise.all([
        getCategories(),
        getProducts(),
        getTables(),
      ])
      setCategories(categoryData)
      setProducts(productData)
      setTables((prev) => tableData.map((table) => mergeTableData(table, prev.find((item) => item.id === table.id))))
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status
        if (status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          window.location.href = '/login'
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

  const patchTable = (updatedTable: RestaurantTable) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === updatedTable.id ? mergeTableData(updatedTable, table) : table,
      ),
    )
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refreshTables = useCallback(async () => {
    try {
      const tableData = await getTables()
      setTables((prev) => tableData.map((table) => mergeTableData(table, prev.find((item) => item.id === table.id))))
    } catch {
      // Keep existing table data on background refresh errors.
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      refreshTables()
    }, 3000)

    return () => window.clearInterval(interval)
  }, [refreshTables])

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchData(true)
    }, 30000)

    return () => window.clearInterval(interval)
  }, [fetchData])

  const addCategory = async (name: string) => {
    await createCategory(name)
    await fetchData(true)
  }

  const editCategory = async (categoryId: number, name: string) => {
    const updatedCategory = await updateCategory(categoryId, name)
    setCategories((prev) =>
      prev.map((category) => (category.id === categoryId ? updatedCategory : category)),
    )
    setProducts((prev) =>
      prev.map((product) =>
        product.category_id === categoryId && product.category
          ? { ...product, category: { ...product.category, name: updatedCategory.name } }
          : product,
      ),
    )
  }

  const removeCategory = async (categoryId: number) => {
    await deleteCategory(categoryId)
    setCategories((prev) => prev.filter((category) => category.id !== categoryId))
  }

  const addProduct = async (payload: {
    category_id: number
    name: string
    price: number
    description?: string
  }) => {
    await createProduct(payload)
    await fetchData(true)
  }

  const editProduct = async (
    id: number,
    payload: {
      category_id: number
      name: string
      price: number
      description?: string | null
      is_active: boolean
    },
  ) => {
    await updateProduct(id, payload)
    await fetchData(true)
  }

  const removeProduct = async (id: number) => {
    await deleteProduct(id)
    await fetchData(true)
  }

  const toggleProductStatus = async (product: Product) => {
    await updateProduct(product.id, {
      category_id: product.category_id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      is_active: !product.is_active,
    })
    await fetchData(true)
  }

  const addTable = async (name: string) => {
    await createTable(name)
    await fetchData(true)
  }

  const editTable = async (tableId: number, name: string) => {
    const updatedTable = await updateTable(tableId, name)
    patchTable(updatedTable)
  }

  const removeTable = async (tableId: number) => {
    await deleteTable(tableId)
    setTables((prev) => prev.filter((table) => table.id !== tableId))
  }

  const assignProductToTable = async (
    tableId: number,
    productId: number,
    quantity = 1,
    note?: string,
  ) => {
    const updatedTable = await addProductToTable(tableId, {
      product_id: productId,
      quantity,
      note: note?.trim() || undefined,
    })
    patchTable(updatedTable)
  }

  const updateTableProductQuantity = async (
    tableId: number,
    pivotId: number,
    payload: {
      quantity: number
      note?: string | null
    },
  ) => {
    const updatedTable = await updateTableItem(tableId, pivotId, payload)
    patchTable(updatedTable)
  }

  const cancelTableProduct = async (tableId: number, pivotId: number) => {
    const updatedTable = await cancelTableItem(tableId, pivotId)
    patchTable(updatedTable)
  }

  const changeTableStatus = async (tableId: number, status: TableStatus) => {
    const updatedTable = await updateTableStatus(tableId, status)
    patchTable(updatedTable)
  }

  const requestTableBill = async (tableId: number) => {
    const updatedTable = await updateTableStatus(tableId, 'bill_requested')
    patchTable(updatedTable)
  }

  const payTableBill = async (tableId: number, paymentMethod: PaymentMethod) => {
    const updatedTable = await closeTable(tableId, paymentMethod)
    patchTable(updatedTable)
    return updatedTable
  }

  const partialPayTableBill = async (
    tableId: number,
    paymentMethod: PaymentMethod,
    items: PartialPayItem[],
  ) => {
    const { table, message } = await partialPayTable(tableId, paymentMethod, items)
    patchTable(table)
    return { table, message }
  }

  const acknowledgeKitchen = async (tableId: number) => {
    const updatedTable = await acknowledgeKitchenReady(tableId)
    patchTable(updatedTable)
    return updatedTable
  }

  return {
    categories,
    products,
    tables,
    loading,
    error,
    addCategory,
    editCategory,
    removeCategory,
    addProduct,
    editProduct,
    removeProduct,
    toggleProductStatus,
    addTable,
    editTable,
    removeTable,
    assignProductToTable,
    updateTableProductQuantity,
    cancelTableProduct,
    changeTableStatus,
    requestTableBill,
    payTableBill,
    partialPayTableBill,
    acknowledgeKitchen,
    refresh: fetchData,
  }
}
