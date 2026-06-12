export type BusinessType = 'restaurant' | 'jeweler'

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  restaurant: 'Restoran',
  jeweler: 'Kuyumcu',
}

export function isJewelerBusiness(
  businessType: BusinessType | string | null | undefined,
): boolean {
  return businessType === 'jeweler'
}

export function isRestaurantBusiness(
  businessType: BusinessType | string | null | undefined,
): boolean {
  return !businessType || businessType === 'restaurant'
}
