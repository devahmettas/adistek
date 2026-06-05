import { useCallback, useEffect, useState } from 'react'
import { createCategory, getCategories } from '../api/categories'
import { createProduct, getProducts } from '../api/products'
import type { Category, Product } from '../api/types'

export default function useRestaurantDetail(restaurantId: number) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [categoryData, productData] = await Promise.all([
        getCategories(restaurantId),
        getProducts(restaurantId),
      ])
      setCategories(categoryData)
      setProducts(productData)
    } catch {
      setError('Restoran detayları yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addCategory = async (name: string) => {
    await createCategory(restaurantId, name)
    await fetchData()
  }

  const addProduct = async (payload: {
    category_id: number
    name: string
    price: number
    description?: string
  }) => {
    await createProduct({
      restaurant_id: restaurantId,
      ...payload,
    })
    await fetchData()
  }

  return {
    categories,
    products,
    loading,
    error,
    addCategory,
    addProduct,
    refresh: fetchData,
  }
}
