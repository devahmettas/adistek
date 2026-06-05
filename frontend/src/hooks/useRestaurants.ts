import { useCallback, useEffect, useState } from 'react'
import { createRestaurant, getRestaurants } from '../api/restaurants'
import type { Restaurant } from '../api/types'

export default function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getRestaurants()
      setRestaurants(data)
    } catch {
      setError('Restoranlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  const addRestaurant = async (name: string) => {
    await createRestaurant(name)
    await fetchRestaurants()
  }

  return {
    restaurants,
    loading,
    error,
    addRestaurant,
    refresh: fetchRestaurants,
  }
}
