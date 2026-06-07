import axios from 'axios'

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export interface PublicMenuProduct {
  id: number
  name: string
  description: string | null
  price: string
}

export interface PublicMenuCategory {
  id: number
  name: string
  products: PublicMenuProduct[]
}

export interface PublicMenu {
  restaurant: {
    id: number
    name: string
    slug: string | null
  }
  categories: PublicMenuCategory[]
}

export const getPublicMenu = async (identifier: string): Promise<PublicMenu> => {
  const { data } = await publicClient.get<{ data: PublicMenu }>(`/public/menu/${identifier}`)
  return data.data
}
