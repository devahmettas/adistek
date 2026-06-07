export function formatOccupiedDuration(occupiedAt: string | null, now = Date.now()): string | null {
  if (!occupiedAt) {
    return null
  }

  const minutes = Math.floor((now - new Date(occupiedAt).getTime()) / 60000)

  if (minutes < 1) {
    return 'Az önce doldu'
  }

  if (minutes < 60) {
    return `${minutes} dk aktif`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes > 0
    ? `${hours} sa ${remainingMinutes} dk aktif`
    : `${hours} sa aktif`
}

export function getActiveTableProducts<T extends { pivot?: { kitchen_status?: string } }>(
  products?: T[],
): T[] {
  return products?.filter((product) => product.pivot?.kitchen_status !== 'cancelled') ?? []
}

export function getTableTotalAmount(products?: { price: string; pivot?: { quantity: number; kitchen_status?: string } }[]): number {
  return getActiveTableProducts(products).reduce(
    (sum, product) => sum + Number(product.price) * (product.pivot?.quantity ?? 1),
    0,
  )
}

export function getTableItemCount(products?: { pivot?: { quantity: number; kitchen_status?: string } }[]): number {
  return getActiveTableProducts(products).reduce(
    (sum, product) => sum + (product.pivot?.quantity ?? 1),
    0,
  )
}

export function getTableWaiterName(table: {
  assigned_waiter_name?: string | null
  assigned_waiter?: { name?: string | null } | null
}): string | null {
  return table.assigned_waiter_name ?? table.assigned_waiter?.name ?? null
}

export function getReadyKitchenItemCount(
  products?: { pivot?: { kitchen_status?: string; quantity?: number } }[],
): number {
  return (
    products?.reduce((sum, product) => {
      if (product.pivot?.kitchen_status !== 'ready') {
        return sum
      }

      return sum + (product.pivot.quantity ?? 1)
    }, 0) ?? 0
  )
}
