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
  payload: {
    product_id: number
    quantity?: number
    note?: string
  },
): Promise<RestaurantTable> => {
  const { data } = await apiClient.post<ApiResponse<RestaurantTable>>(
    `/tables/${tableId}/products`,
    payload,
  )
  return data.data
}

export const updateTableProduct = async (
  tableId: number,
  productId: number,
  payload: {
    quantity: number
    note?: string | null
  },
): Promise<RestaurantTable> => {
  const { data } = await apiClient.patch<ApiResponse<RestaurantTable>>(
    `/tables/${tableId}/products/${productId}`,
    payload,
  )
  return data.data
}

export const updateTableStatus = async (
  tableId: number,
  status: string,
): Promise<RestaurantTable> => {
  const { data } = await apiClient.patch<ApiResponse<RestaurantTable>>(
    `/tables/${tableId}/status`,
    { status },
  )
  return data.data
}

export const closeTable = async (tableId: number): Promise<RestaurantTable> => {
  const { data } = await apiClient.post<ApiResponse<RestaurantTable>>(`/tables/${tableId}/close`)
  return data.data
}
