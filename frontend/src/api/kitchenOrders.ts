import kitchenClient from './kitchenClient'
import type { ApiResponse, KitchenOrder } from './types'

export const getKitchenOrders = async (): Promise<KitchenOrder[]> => {
  const { data } = await kitchenClient.get<ApiResponse<KitchenOrder[]>>('/kitchen/orders')
  return data.data
}

export const markKitchenOrderReady = async (pivotId: number): Promise<void> => {
  await kitchenClient.patch(`/kitchen/orders/${pivotId}/ready`)
}

export const dismissKitchenCancelled = async (pivotId: number): Promise<void> => {
  await kitchenClient.patch(`/kitchen/orders/${pivotId}/dismiss`)
}
