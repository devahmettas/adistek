import apiClient from './client'
import type { ApiResponse, RestaurantTable } from './types'

export const getTables = async (): Promise<RestaurantTable[]> => {
  const { data } = await apiClient.get<ApiResponse<RestaurantTable[]>>('/tables')
  return data.data
}

export const createTable = async (name: string): Promise<RestaurantTable> => {
  const { data } = await apiClient.post<ApiResponse<RestaurantTable>>('/tables', { name })
  return data.data
}

export const addProductToTable = async (
  tableId: number,
  productId: number,
): Promise<RestaurantTable> => {
  const { data } = await apiClient.post<ApiResponse<RestaurantTable>>(
    `/tables/${tableId}/products`,
    { product_id: productId },
  )
  return data.data
}
