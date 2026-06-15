import JsBarcode from 'jsbarcode'

export type BarcodeRenderSize = 'xs' | 'sm' | 'md' | 'print' | 'strip'

const SIZE_OPTIONS: Record<BarcodeRenderSize, { width: number; height: number; fontSize: number }> = {
  xs: { width: 0.55, height: 14, fontSize: 7 },
  sm: { width: 0.75, height: 22, fontSize: 9 },
  md: { width: 1, height: 32, fontSize: 11 },
  print: { width: 1.15, height: 34, fontSize: 10 },
  strip: { width: 0.7, height: 24, fontSize: 7 },
}

export function renderBarcodeSvgString(
  value: string | null | undefined,
  size: BarcodeRenderSize = 'sm',
  showValue = false,
): string | null {
  const trimmed = value?.trim()
  if (!trimmed || typeof document === 'undefined') return null

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  try {
    const options = SIZE_OPTIONS[size]
    JsBarcode(svg, trimmed, {
      format: 'CODE128',
      width: options.width,
      height: options.height,
      displayValue: showValue,
      fontSize: options.fontSize,
      margin: 2,
      background: '#ffffff',
      lineColor: '#000000',
    })
    return svg.outerHTML
  } catch {
    return null
  }
}
