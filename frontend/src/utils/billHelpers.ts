import type { Product } from '../api/types'

export interface BillLinePivot {
  pivotId: number
  quantity: number
}

export interface BillLineGroup {
  key: string
  productId: number
  name: string
  note: string | null
  unitPrice: number
  totalQuantity: number
  lineTotal: number
  pivots: BillLinePivot[]
  description?: string | null
  categoryName?: string | null
}

export interface PartialPayItem {
  pivot_id: number
  quantity: number
}

function normalizeNote(note?: string | null): string | null {
  if (!note) {
    return null
  }

  const trimmed = note.trim()

  return trimmed === '' ? null : trimmed
}

export function groupBillProducts(products: Product[]): BillLineGroup[] {
  const groups = new Map<string, BillLineGroup>()

  for (const product of products) {
    const pivotId = product.pivot?.id
    if (!pivotId) {
      continue
    }

    const note = normalizeNote(product.pivot?.note)
    const quantity = product.pivot?.quantity ?? 1
    const unitPrice = Number(product.price)
    const key = `${product.id}:${note ?? ''}`

    const existing = groups.get(key)

    if (existing) {
      existing.totalQuantity += quantity
      existing.lineTotal += unitPrice * quantity
      existing.pivots.push({ pivotId, quantity })
      continue
    }

    groups.set(key, {
      key,
      productId: product.id,
      name: product.name,
      note,
      unitPrice,
      totalQuantity: quantity,
      lineTotal: unitPrice * quantity,
      pivots: [{ pivotId, quantity }],
      description: product.description,
      categoryName: product.category?.name,
    })
  }

  return Array.from(groups.values())
}

export function buildPartialPayItems(
  groups: BillLineGroup[],
  selectedQuantities: Record<string, number>,
): PartialPayItem[] {
  const items: PartialPayItem[] = []

  for (const group of groups) {
    let remaining = selectedQuantities[group.key] ?? 0

    if (remaining <= 0) {
      continue
    }

    for (const pivot of group.pivots) {
      if (remaining <= 0) {
        break
      }

      const payQuantity = Math.min(remaining, pivot.quantity)
      items.push({ pivot_id: pivot.pivotId, quantity: payQuantity })
      remaining -= payQuantity
    }
  }

  return items
}

export function getSelectedBillTotal(
  groups: BillLineGroup[],
  selectedQuantities: Record<string, number>,
): number {
  return groups.reduce(
    (sum, group) => sum + (selectedQuantities[group.key] ?? 0) * group.unitPrice,
    0,
  )
}

export function getSelectedBillCount(selectedQuantities: Record<string, number>): number {
  return Object.values(selectedQuantities).reduce((sum, quantity) => sum + quantity, 0)
}

export function getAllBillSelections(groups: BillLineGroup[]): Record<string, number> {
  return Object.fromEntries(groups.map((group) => [group.key, group.totalQuantity]))
}
