import { useCallback, useEffect, useState } from 'react'
import { createAdminRestaurant, getAdminRestaurants, type CreateAdminRestaurantPayload } from '../api/adminAuth'
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

  const addRestaurant = useCallback(async (payload: CreateAdminRestaurantPayload) => {
    const restaurant = await createAdminRestaurant(payload)
    setRestaurants((current) => [restaurant, ...current])
    return restaurant
  }, [])

  return {
    restaurants,
    loading,
    error,
    refresh: fetchRestaurants,
    addRestaurant,
  }
}
