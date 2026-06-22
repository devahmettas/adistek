import { useCallback, useEffect, useState } from 'react'
import {
  createAdminRestaurant,
  deleteAdminRestaurant,
  extendAdminRestaurantMembership,
  getAdminRestaurants,
  updateAdminRestaurant,
  type CreateAdminRestaurantPayload,
  type UpdateAdminRestaurantPayload,
} from '../api/adminAuth'
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

  const removeRestaurant = useCallback((id: number) => {
    setRestaurants((current) => current.filter((restaurant) => restaurant.id !== id))
  }, [])

  const replaceRestaurant = useCallback((restaurant: RestaurantListItem) => {
    setRestaurants((current) =>
      current.map((item) => (item.id === restaurant.id ? restaurant : item)),
    )
  }, [])

  const deleteRestaurant = useCallback(
    async (id: number) => {
      await deleteAdminRestaurant(id)
      removeRestaurant(id)
    },
    [removeRestaurant],
  )

  const extendMembership = useCallback(
    async (id: number, days: number) => {
      const restaurant = await extendAdminRestaurantMembership(id, days)
      replaceRestaurant(restaurant)
      return restaurant
    },
    [replaceRestaurant],
  )

  const adjustMembership = extendMembership

  const updateRestaurantFields = useCallback(
    async (id: number, payload: UpdateAdminRestaurantPayload) => {
      const restaurant = await updateAdminRestaurant(id, payload)
      replaceRestaurant(restaurant)
      return restaurant
    },
    [replaceRestaurant],
  )

  return {
    restaurants,
    loading,
    error,
    refresh: fetchRestaurants,
    addRestaurant,
    deleteRestaurant,
    extendMembership,
    adjustMembership,
    updateRestaurantFields,
    replaceRestaurant,
  }
}
