import axios from 'axios'
import type { AllergenKey } from '../constants/allergens'
import type { MenuLanguage } from '../i18n'

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
  image_path: string | null
  image_url: string | null
  calories: number | null
  allergens: AllergenKey[]
}

export interface PublicMenuCategory {
  id: number
  name: string
  image_path: string | null
  image_url: string | null
  products: PublicMenuProduct[]
}

export interface PublicMenuSlide {
  id: number
  title: string
  subtitle: string | null
  image_path: string | null
  image_url: string | null
  link_url: string | null
}

export interface PublicMenuSettings {
  tagline: string | null
  welcome_text: string | null
}

export interface PublicMenu {
  restaurant: {
    id: number
    name: string
    slug: string | null
  }
  menu_settings: PublicMenuSettings
  slides: PublicMenuSlide[]
  categories: PublicMenuCategory[]
}

export const getPublicMenu = async (
  identifier: string,
  lang?: MenuLanguage,
): Promise<PublicMenu> => {
  const { data } = await publicClient.get<{ data: PublicMenu }>(`/public/menu/${identifier}`, {
    params: lang && lang !== 'tr' ? { lang } : undefined,
  })
  return data.data
}
