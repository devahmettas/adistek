import { useCallback, useEffect, useState } from 'react'
import { createCategory, getCategories } from '../api/categories'
import { createProduct, deleteProduct, getProducts, updateProduct } from '../api/products'
import { createTable, addProductToTable, getTables } from '../api/tables'
import type { Category, Product, RestaurantTable } from '../api/types'

export default function useDashboard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [categoryData, productData, tableData] = await Promise.all([
        getCategories(),
        getProducts(),
        getTables(),
      ])
      setCategories(categoryData)
      setProducts(productData)
      setTables(tableData)
    } catch {
      setError('Veriler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addCategory = async (name: string) => {
    await createCategory(name)
    await fetchData()
  }

  const addProduct = async (payload: {
    category_id: number
    name: string
    price: number
    description?: string
  }) => {
    await createProduct(payload)
    await fetchData()
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
    await fetchData()
  }

  const removeProduct = async (id: number) => {
    await deleteProduct(id)
    await fetchData()
  }

  const toggleProductStatus = async (product: Product) => {
    await updateProduct(product.id, {
      category_id: product.category_id,
      name: product.name,
      price: Number(product.price),
      description: product.description,
      is_active: !product.is_active,
    })
    await fetchData()
  }

  const addTable = async (name: string) => {
    await createTable(name)
    await fetchData()
  }

  const assignProductToTable = async (tableId: number, productId: number) => {
    await addProductToTable(tableId, productId)
    await fetchData()
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
    refresh: fetchData,
  }
}
