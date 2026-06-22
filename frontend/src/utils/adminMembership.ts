export function formatServiceFee(fee: string | number | null | undefined): string {
  const value = Number(fee ?? 0)

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatMembershipStatus(
  daysRemaining: number | undefined,
  expired: boolean | undefined,
  endDate?: string | null,
): string {
  if (expired) {
    return 'Üyelik süresi doldu'
  }

  if (daysRemaining === 0) {
    return 'Bugün son gün'
  }

  if (typeof daysRemaining === 'number') {
    return `${daysRemaining} gün kaldı`
  }

  if (endDate) {
    return `Bitiş: ${new Date(endDate).toLocaleDateString('tr-TR')}`
  }

  return 'Üyelik bilgisi yok'
}

export function formatMembershipEndDate(endDate?: string | null): string {
  if (!endDate) {
    return '—'
  }

  return new Date(endDate).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getGoogleMapsDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`
}

export function hasUsableAddress(address?: string | null): boolean {
  return Boolean(address?.trim())
}
