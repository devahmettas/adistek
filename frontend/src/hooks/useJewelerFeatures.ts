import { useAuth } from '../store/AuthStore'

export function useJewelerFeatures() {
  const { restaurant } = useAuth()

  return {
    barcodeEnabled: restaurant?.feature_jeweler_barcode ?? true,
    reportsEnabled: restaurant?.feature_jeweler_reports ?? true,
  }
}
