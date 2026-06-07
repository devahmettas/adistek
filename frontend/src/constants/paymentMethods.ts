export type PaymentMethod = 'cash' | 'card'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Nakit',
  card: 'Kart',
}

/** Kart önce — varsayılan satış tipi */
export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['card', 'cash']

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'card'
