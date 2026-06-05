import apiClient from './client'
import type { ApiResponse, Waiter } from './types'

export const getWaiters = async (): Promise<Waiter[]> => {
  const { data } = await apiClient.get<ApiResponse<Waiter[]>>('/waiters')
  return data.data
}

export const createWaiter = async (payload: {
  name: string
  email: string
  password: string
}): Promise<Waiter> => {
  const { data } = await apiClient.post<ApiResponse<Waiter>>('/waiters', payload)
  return data.data
}

export const updateWaiter = async (
  id: number,
  payload: {
    name?: string
    email?: string
    password?: string
    is_active?: boolean
  },
): Promise<Waiter> => {
  const { data } = await apiClient.put<ApiResponse<Waiter>>(`/waiters/${id}`, payload)
  return data.data
}

export const deleteWaiter = async (id: number): Promise<void> => {
  await apiClient.delete(`/waiters/${id}`)
}
