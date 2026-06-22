export type BarcodeScanTone = 'success' | 'warning' | 'error'

export interface BarcodeScanFeedback {
  message: string
  tone: BarcodeScanTone
}

export function normalizeBarcodeScanFeedback(
  result: BarcodeScanFeedback | string | null | void,
): BarcodeScanFeedback | null {
  if (!result) return null

  if (typeof result === 'string') {
    const message = result.trim()
    return message ? { message, tone: 'success' } : null
  }

  const message = result.message.trim()
  return message ? { message, tone: result.tone } : null
}

export const BARCODE_SCAN_MESSAGE_STYLES: Record<BarcodeScanTone, string> = {
  success: 'rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800',
  warning: 'rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900',
  error: 'rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800',
}

export const BARCODE_SCAN_TOAST_STYLES: Record<BarcodeScanTone, string> = {
  success: 'border-emerald-400/50 bg-emerald-50 text-emerald-900 ring-emerald-200',
  warning: 'border-amber-400/50 bg-amber-50 text-amber-950 ring-amber-200',
  error: 'border-red-400/50 bg-red-50 text-red-900 ring-red-200',
}
