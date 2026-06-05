import { useCallback, useEffect, useState } from 'react'
import { getAdminRestaurants } from '../api/adminAuth'
import type { RestaurantListItem } from '../api/types'

export default function useAdminRestaurants() {
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getAdminRestaurants()
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

  return {
    restaurants,
    loading,
    error,
    refresh: fetchRestaurants,
  }
}
