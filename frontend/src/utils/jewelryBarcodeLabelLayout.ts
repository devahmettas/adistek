/** TSC TE210 @ 203 DPI — 1 mm ≈ 8 dot */
export const DOTS_PER_MM = 8

/** Kuyumcu barkod etiketi: 72 mm genişlik × 10 mm yükseklik */
export const LABEL_WIDTH_MM = 72
export const LABEL_HEIGHT_MM = 10

/** Sol uçtaki ince çentik/kuyruk — tamamen boş bırakılır; baskı sağdan sola başlar */
export const LABEL_TAIL_WIDTH_MM = 18

/** Çentik hariç ana gövde */
export const LABEL_BODY_WIDTH_MM = LABEL_WIDTH_MM - LABEL_TAIL_WIDTH_MM

export const LABEL_MARGIN_MM = 1
export const LABEL_COLUMN_GAP_MM = 1

/** Çentik ile baskı alanı arasında ek güvenlik boşluğu */
export const LABEL_TAIL_SAFE_GAP_MM = 2

/** Barkodu çentikten uzaklaştırmak için ek sağa kaydırma */
export const LABEL_BARCODE_SHIFT_MM = 8

/** İnce barkod çizgisi (dot) */
export const LABEL_BARCODE_NARROW = 1
export const LABEL_BARCODE_WIDE = 2

/** Gövde içinde sağdan sola: ürün bilgisi sağda, barkod solda (~%45) */
export const LABEL_BARCODE_COLUMN_RATIO = 0.45

export const LABEL_WIDTH_DOTS = LABEL_WIDTH_MM * DOTS_PER_MM
export const LABEL_HEIGHT_DOTS = LABEL_HEIGHT_MM * DOTS_PER_MM
export const LABEL_TAIL_WIDTH_DOTS = LABEL_TAIL_WIDTH_MM * DOTS_PER_MM
export const LABEL_BODY_WIDTH_DOTS = LABEL_BODY_WIDTH_MM * DOTS_PER_MM
export const LABEL_MARGIN_DOTS = LABEL_MARGIN_MM * DOTS_PER_MM

export interface JewelryBarcodeLabel {
  name: string
  barcode: string
  karat?: number | null
  weightGram?: string | null
  salePrice?: string | number | null
}

/** CODE128: start(11) + data(11×n) + checksum(11) + stop(13) */
export function estimateCode128Modules(value: string): number {
  return 35 + 11 * value.length
}

/** TSC BARCODE narrow/wide ile yaklaşık genişlik (dot). */
export function estimateCode128WidthDots(
  value: string,
  narrow: number,
): number {
  const modules = estimateCode128Modules(value)
  const wide = narrow * 2
  return Math.ceil(modules * ((narrow + wide) / 2))
}

export function resolveBarcodeNarrow(
  barcode: string,
  maxWidthDots: number,
): number {
  void barcode
  void maxWidthDots
  return LABEL_BARCODE_NARROW
}

function textWidthDots(text: string, font: string, xMul: number): number {
  const charWidth = font === '1' ? 8 : 8
  return text.length * charWidth * xMul
}

function resolveBarcodeBlock(
  columnX: number,
  columnWidth: number,
  barcode: string,
  narrow: number,
  minX: number,
): {
  blockX: number
  blockWidth: number
  barcodeX: number
  barcodeWidth: number
  barcodeNumberX: number
  barcodeNumberWidth: number
} {
  const barcodeWidth = estimateCode128WidthDots(barcode, narrow)
  const barcodeNumberWidth = textWidthDots(barcode, '1', 1)
  const blockWidth = Math.max(barcodeWidth, barcodeNumberWidth)
  const shift = mmToDots(LABEL_BARCODE_SHIFT_MM)
  const padding = mmToDots(0.5)
  const maxBlockX = columnX + columnWidth - blockWidth - padding
  const blockX = Math.max(minX, maxBlockX + shift)
  const barcodeX = blockX + Math.floor((blockWidth - barcodeWidth) / 2)
  const barcodeNumberX = blockX + Math.floor((blockWidth - barcodeNumberWidth) / 2)

  return {
    blockX,
    blockWidth,
    barcodeX,
    barcodeWidth,
    barcodeNumberX,
    barcodeNumberWidth,
  }
}

export function mmToDots(mm: number): number {
  return Math.round(mm * DOTS_PER_MM)
}

export function formatLabelGram(weightGram: string | null | undefined): string {
  if (!weightGram?.trim()) return ''

  const normalized = weightGram.trim().replace(',', '.')
  const numeric = Number(normalized)

  if (Number.isFinite(numeric)) {
    return `${numeric.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} gr`
  }

  return weightGram.toLowerCase().includes('gr') ? weightGram.trim() : `${weightGram.trim()} gr`
}

export function formatLabelAyar(karat: number | null | undefined): string {
  if (!karat) return ''
  return `${karat}K`
}

export function truncateLabelText(text: string, maxChars: number): string {
  const trimmed = text.trim()
  if (maxChars <= 0) return ''
  if (trimmed.length <= maxChars) return trimmed
  if (maxChars === 1) return '…'
  return `${trimmed.slice(0, maxChars - 1)}…`
}

export interface LabelLayoutMetrics {
  bodyX: number
  bodyY: number
  bodyWidth: number
  bodyHeight: number
  barcodeColumnX: number
  barcodeColumnWidth: number
  infoColumnX: number
  infoColumnWidth: number
  barcodeNarrow: number
  barcodeWide: number
  barcodeX: number
  barcodeWidth: number
  barcodeBlockX: number
  barcodeBlockWidth: number
  barcodeNumberX: number
  barcodeNumberWidth: number
  barcodeHeight: number
  barcodeY: number
  barcodeNumberY: number
  infoLineHeight: number
  infoFont: string
  infoXMul: number
  infoYMul: number
  barcodeNumberFont: string
  barcodeNumberXMul: number
  barcodeNumberYMul: number
  infoStartY: number
  productName: string
  gramLine: string
  ayarLine: string
}

export function buildLabelLayout(label: JewelryBarcodeLabel): LabelLayoutMetrics {
  const tailSafeMinX = LABEL_TAIL_WIDTH_DOTS + mmToDots(LABEL_TAIL_SAFE_GAP_MM)
  const bodyX = tailSafeMinX + LABEL_MARGIN_DOTS
  const bodyY = LABEL_MARGIN_DOTS
  const bodyWidth = LABEL_WIDTH_DOTS - bodyX - LABEL_MARGIN_DOTS
  const bodyHeight = LABEL_HEIGHT_DOTS - LABEL_MARGIN_DOTS * 2

  const columnGap = mmToDots(LABEL_COLUMN_GAP_MM)
  const infoColumnWidth = Math.floor(bodyWidth * (1 - LABEL_BARCODE_COLUMN_RATIO))
  const barcodeColumnWidth = bodyWidth - infoColumnWidth - columnGap

  // Sağdan sola: ürün bilgisi sağ kenarda, barkod onun solunda
  const infoColumnX = bodyX + barcodeColumnWidth + columnGap
  const barcodeColumnX = bodyX

  const barcodeNarrow = resolveBarcodeNarrow(label.barcode, barcodeColumnWidth - mmToDots(0.5))
  const barcodeWide = LABEL_BARCODE_WIDE
  const barcodeBlock = resolveBarcodeBlock(
    barcodeColumnX,
    barcodeColumnWidth,
    label.barcode,
    barcodeNarrow,
    tailSafeMinX,
  )
  const {
    blockX: barcodeBlockX,
    blockWidth: barcodeBlockWidth,
    barcodeX,
    barcodeWidth,
    barcodeNumberX,
    barcodeNumberWidth,
  } = barcodeBlock
  const barcodeNumberHeight = mmToDots(2.2)
  const barcodeHeight = Math.max(
    mmToDots(3.8),
    bodyHeight - barcodeNumberHeight - mmToDots(0.4),
  )

  const barcodeBlockHeight = barcodeHeight + barcodeNumberHeight + mmToDots(0.4)
  const barcodeY = bodyY + Math.max(0, Math.floor((bodyHeight - barcodeBlockHeight) / 2))
  const barcodeNumberY = barcodeY + barcodeHeight + mmToDots(0.3)

  const infoFont = '1'
  const infoXMul = 1
  const infoYMul = 1
  const infoLineHeight = 13
  const infoLines = [
    label.name,
    formatLabelGram(label.weightGram),
    formatLabelAyar(label.karat),
  ].filter(Boolean)

  const infoBlockHeight = infoLines.length * infoLineHeight
  const infoStartY = bodyY + Math.max(0, Math.floor((bodyHeight - infoBlockHeight) / 2))

  const maxNameChars = Math.max(6, Math.floor(infoColumnWidth / 7))
  const productName = truncateLabelText(label.name, maxNameChars)

  return {
    bodyX,
    bodyY,
    bodyWidth,
    bodyHeight,
    barcodeColumnX,
    barcodeColumnWidth,
    infoColumnX,
    infoColumnWidth,
    barcodeNarrow,
    barcodeWide,
    barcodeX,
    barcodeWidth,
    barcodeBlockX,
    barcodeBlockWidth,
    barcodeNumberX,
    barcodeNumberWidth,
    barcodeHeight,
    barcodeY,
    barcodeNumberY,
    infoLineHeight,
    infoFont,
    infoXMul,
    infoYMul,
    barcodeNumberFont: '1',
    barcodeNumberXMul: 1,
    barcodeNumberYMul: 1,
    productName,
    gramLine: formatLabelGram(label.weightGram),
    ayarLine: formatLabelAyar(label.karat),
    infoStartY,
  }
}

export function toJewelryBarcodeLabel(product: {
  name: string
  barcode: string | null
  karat?: number | null
  weight_gram?: string | null
  sale_price?: string | number | null
}): JewelryBarcodeLabel | null {
  if (!product.barcode?.trim()) return null

  return {
    name: product.name,
    barcode: product.barcode.trim(),
    karat: product.karat,
    weightGram: product.weight_gram,
    salePrice: product.sale_price,
  }
}
