import axios from 'axios'
import type { PublicMenuCategory } from './publicMenu'

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export interface TableOrderPage {
  table: {
    id: number
    name: string
  }
  restaurant: {
    id: number
    name: string
    slug: string | null
  }
  categories: PublicMenuCategory[]
  can_order: boolean
}

export interface GuestOrderItem {
  product_id: number
  quantity: number
  note?: string | null
}

export interface GuestOrderResult {
  message: string
  table_name: string
  item_count: number
}

export const getTableOrderPage = async (token: string): Promise<TableOrderPage> => {
  const { data } = await publicClient.get<{ data: TableOrderPage }>(`/public/table/${token}`)
  return data.data
}

export const placeGuestOrder = async (
  token: string,
  items: GuestOrderItem[],
): Promise<GuestOrderResult> => {
  const { data } = await publicClient.post<{ data: GuestOrderResult; message: string }>(
    `/public/table/${token}/order`,
    { items },
  )
  return data.data
}

export const getTableOrderUrl = (qrToken: string): string =>
  `${window.location.origin}/order/${qrToken}`
