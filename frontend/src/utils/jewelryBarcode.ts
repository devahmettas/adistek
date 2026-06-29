import JsBarcode from 'jsbarcode'

export type BarcodeRenderSize = 'xs' | 'sm' | 'md' | 'print' | 'strip' | 'label'

const SIZE_OPTIONS: Record<BarcodeRenderSize, { width: number; height: number; fontSize: number }> = {
  xs: { width: 0.55, height: 14, fontSize: 7 },
  sm: { width: 0.75, height: 22, fontSize: 9 },
  md: { width: 1, height: 32, fontSize: 11 },
  print: { width: 1.15, height: 34, fontSize: 10 },
  strip: { width: 0.7, height: 24, fontSize: 7 },
  label: { width: 0.85, height: 28, fontSize: 7 },
}

/** CODE128: start(11) + data(11×n) + checksum(11) + stop(13) */
function estimateCode128Modules(value: string): number {
  return 35 + 11 * value.length
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
      margin: size === 'label' ? 0 : 2,
      background: '#ffffff',
      lineColor: '#000000',
    })
    return svg.outerHTML
  } catch {
    return null
  }
}

/** Dar kuyumcu etiketi için milimetre hedefine göre barkod üretir. */
export function renderBarcodeSvgForLabel(
  value: string | null | undefined,
  lengthMm: number,
  thicknessMm: number,
  preferredModuleWidthMm = 0.12,
  preferredWideModuleWidthMm = 0.24,
): string | null {
  const trimmed = value?.trim()
  if (!trimmed || typeof document === 'undefined') return null

  const pxPerMm = 10
  const targetWidthPx = lengthMm * pxPerMm * 0.96
  const targetHeightPx = thicknessMm * pxPerMm * 0.96
  const modules = estimateCode128Modules(trimmed)
  const moduleWidthFromPreferred = preferredModuleWidthMm * pxPerMm
  const moduleWidthFromFit = targetWidthPx / modules
  const moduleWidth = Math.min(
    moduleWidthFromPreferred > 0 ? moduleWidthFromPreferred : moduleWidthFromFit,
    moduleWidthFromFit,
    preferredWideModuleWidthMm * pxPerMm,
    1.2,
  )

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  try {
    JsBarcode(svg, trimmed, {
      format: 'CODE128',
      width: Math.max(0.5, moduleWidth),
      height: targetHeightPx,
      displayValue: false,
      margin: 0,
      background: '#ffffff',
      lineColor: '#000000',
    })
    return svg.outerHTML
  } catch {
    return null
  }
}
