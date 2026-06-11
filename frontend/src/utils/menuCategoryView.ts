import type { PublicMenuCategory, PublicMenuProduct } from '../api/publicMenu'

export const ALL_PRODUCTS_VIEW = 'all' as const

export type MenuCategorySelection = number | typeof ALL_PRODUCTS_VIEW

export function flattenMenuProducts(categories: PublicMenuCategory[]): PublicMenuProduct[] {
  return categories.flatMap((category) => category.products)
}

export function countMenuProducts(categories: PublicMenuCategory[]): number {
  return categories.reduce((sum, category) => sum + category.products.length, 0)
}
