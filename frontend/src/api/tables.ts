import type { AxiosInstance } from 'axios'
import apiClient from './client'
import type { ApiResponse, RestaurantTable } from './types'

export const getTables = async (client: AxiosInstance = apiClient): Promise<RestaurantTable[]> => {
  const { data } = await client.get<ApiResponse<RestaurantTable[]>>('/tables')
  return data.data
}

export const createTable = async (name: string): Promise<RestaurantTable> => {
  const { data } = await apiClient.post<ApiResponse<RestaurantTable>>('/tables', { name })
  return data.data
}

export const updateTable = async (tableId: number, name: string): Promise<RestaurantTable> => {
  const { data } = await apiClient.put<ApiResponse<RestaurantTable>>(`/tables/${tableId}`, { name })
  return data.data
}

export const deleteTable = async (tableId: number): Promise<void> => {
  await apiClient.delete(`/tables/${tableId}`)
}

export const addProductToTable = async (
  tableId: number,
  payload: {
    product_id: number
    quantity?: number
    note?: string
  },
  client: AxiosInstance = apiClient,
): Promise<RestaurantTable> => {
  const { data } = await client.post<ApiResponse<RestaurantTable>>(
    `/tables/${tableId}/products`,
    payload,
  )
  return data.data
}

export const updateTableItem = async (
  tableId: number,
  pivotId: number,
  payload: {
    quantity: number
    note?: string | null
  },
  client: AxiosInstance = apiClient,
): Promise<RestaurantTable> => {
  const { data } = await client.patch<ApiResponse<RestaurantTable>>(
    `/tables/${tableId}/items/${pivotId}`,
    payload,
  )
  return data.data
}

export const cancelTableItem = async (
  tableId: number,
  pivotId: number,
  client: AxiosInstance = apiClient,
): Promise<RestaurantTable> => {
  const { data } = await client.post<ApiResponse<RestaurantTable>>(
    `/tables/${tableId}/items/${pivotId}/cancel`,
  )
  return data.data
}

export const updateTableStatus = async (
  tableId: number,
  status: string,
  client: AxiosInstance = apiClient,
): Promise<RestaurantTable> => {
  const { data } = await client.patch<ApiResponse<RestaurantTable>>(
    `/tables/${tableId}/status`,
    { status },
  )
  return data.data
}

export const closeTable = async (
  tableId: number,
  client: AxiosInstance = apiClient,
): Promise<RestaurantTable> => {
  const { data } = await client.post<ApiResponse<RestaurantTable>>(`/tables/${tableId}/close`)
  return data.data
}

export const claimTableView = async (
  tableId: number,
  client: AxiosInstance = apiClient,
): Promise<RestaurantTable> => {
  const { data } = await client.post<ApiResponse<RestaurantTable>>(`/tables/${tableId}/view`)
  return data.data
}

export const releaseTableView = async (
  tableId: number,
  client: AxiosInstance = apiClient,
): Promise<RestaurantTable> => {
  const { data } = await client.delete<ApiResponse<RestaurantTable>>(`/tables/${tableId}/view`)
  return data.data
}

export const acknowledgeKitchenReady = async (
  tableId: number,
  client: AxiosInstance = apiClient,
): Promise<RestaurantTable> => {
  const { data } = await client.post<ApiResponse<RestaurantTable>>(
    `/tables/${tableId}/kitchen/acknowledge`,
  )
  return data.data
}
