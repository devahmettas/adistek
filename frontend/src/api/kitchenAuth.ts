import kitchenClient from './kitchenClient'
import type { ApiResponse, KitchenAuthResponse, KitchenStaff } from './types'

export const kitchenLogin = async (
  email: string,
  password: string,
): Promise<KitchenAuthResponse> => {
  const { data } = await kitchenClient.post<ApiResponse<KitchenAuthResponse>>('/kitchen/auth/login', {
    email,
    password,
  })
  return data.data
}

export const getKitchenMe = async (): Promise<KitchenStaff> => {
  const { data } = await kitchenClient.get<ApiResponse<KitchenStaff>>('/kitchen/auth/me')
  return data.data
}

export const kitchenLogout = async (): Promise<void> => {
  await kitchenClient.post('/kitchen/auth/logout')
}
