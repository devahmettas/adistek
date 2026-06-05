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

export function getTableTotalAmount(products?: { price: string; pivot?: { quantity: number } }[]): number {
  return (
    products?.reduce(
      (sum, product) => sum + Number(product.price) * (product.pivot?.quantity ?? 1),
      0,
    ) ?? 0
  )
}

export function getTableItemCount(products?: { pivot?: { quantity: number } }[]): number {
  return products?.reduce((sum, product) => sum + (product.pivot?.quantity ?? 1), 0) ?? 0
}

export function getTableWaiterName(table: {
  viewing_waiter_name?: string | null
  viewing_waiter?: { name?: string | null } | null
}): string | null {
  return table.viewing_waiter_name ?? table.viewing_waiter?.name ?? null
}
