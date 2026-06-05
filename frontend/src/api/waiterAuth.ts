import waiterClient from './waiterClient'
import type { ApiResponse, Waiter, WaiterAuthResponse } from './types'

export const waiterLogin = async (email: string, password: string): Promise<WaiterAuthResponse> => {
  const { data } = await waiterClient.post<ApiResponse<WaiterAuthResponse>>('/waiter/auth/login', {
    email,
    password,
  })
  return data.data
}

export const getWaiterMe = async (): Promise<Waiter> => {
  const { data } = await waiterClient.get<ApiResponse<Waiter>>('/waiter/auth/me')
  return data.data
}

export const waiterLogout = async (): Promise<void> => {
  await waiterClient.post('/waiter/auth/logout')
}
