import { useCallback, useEffect, useState } from 'react'
import { createCategory, getCategories } from '../api/categories'
import { createProduct, deleteProduct, getProducts, updateProduct } from '../api/products'
import { createTable, addProductToTable, closeTable, getTables, updateTableProduct, updateTableStatus } from '../api/tables'
import { TOKEN_KEY } from '../api/client'
import type { Category, Product, RestaurantTable } from '../api/types'
import type { TableStatus } from '../constants/tableStatuses'

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
      setTables(tableData)
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
      prev.map((table) => (table.id === updatedTable.id ? updatedTable : table)),
    )
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addCategory = async (name: string) => {
    await createCategory(name)
    await fetchData(true)
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
    productId: number,
    payload: {
      quantity: number
      note?: string | null
    },
  ) => {
    const updatedTable = await updateTableProduct(tableId, productId, payload)
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

  const payTableBill = async (tableId: number) => {
    const updatedTable = await closeTable(tableId)
    patchTable(updatedTable)
  }

  return {
    categories,
    products,
    tables,
    loading,
    error,
    addCategory,
    addProduct,
    editProduct,
    removeProduct,
    toggleProductStatus,
    addTable,
    assignProductToTable,
    updateTableProductQuantity,
    changeTableStatus,
    requestTableBill,
    payTableBill,
    refresh: fetchData,
  }
}
