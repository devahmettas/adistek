import { renderBarcodeSvgForLabel } from './jewelryBarcode'

export interface JewelryBarcodeLabel {
  name: string
  barcode: string
  karat?: number | null
  weightGram?: string | null
  salePrice?: string | number | null
}

/** Kuyumcu barkod etiketi: 10 mm genişlik × 72 mm yükseklik */
export const LABEL_WIDTH_MM = 10
export const LABEL_HEIGHT_MM = 72

const LABEL_PADDING_V_MM = 0.4
const LABEL_PADDING_H_MM = 0.3
const META_ROW_MM = 5
const CODE_ROW_MM = 5

/** Barkod çizgisi — metin satırlarına taşmaması için içeride ve biraz küçük */
const BARCODE_LENGTH_MM = 54
const BARCODE_THICKNESS_MM = 6.8

export const LABEL_BARCODE_LENGTH_MM = BARCODE_LENGTH_MM
export const LABEL_BARCODE_THICKNESS_MM = BARCODE_THICKNESS_MM

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolveBarcodeDimensions(barcode: string): { lengthMm: number; thicknessMm: number } {
  const len = barcode.trim().length
  let lengthMm = BARCODE_LENGTH_MM

  if (len > 14) {
    lengthMm = BARCODE_LENGTH_MM - 8
  } else if (len > 10) {
    lengthMm = BARCODE_LENGTH_MM - 4
  }

  return {
    lengthMm,
    thicknessMm: BARCODE_THICKNESS_MM,
  }
}

function buildLabelPageHtml(label: JewelryBarcodeLabel): string {
  const { lengthMm, thicknessMm } = resolveBarcodeDimensions(label.barcode)
  const barcodeSvg = renderBarcodeSvgForLabel(
    label.barcode,
    lengthMm,
    thicknessMm,
  )
  if (!barcodeSvg) return ''

  const metaParts = [
    label.karat ? `${label.karat}A` : null,
    label.weightGram ? `${label.weightGram}g` : null,
  ].filter(Boolean)

  const metaLine = metaParts.length > 0
    ? `<div class="meta">${escapeHtml(metaParts.join(' '))}</div>`
    : '<div class="meta meta-empty">&nbsp;</div>'

  return `
    <section class="label-page">
      <div class="label">
        ${metaLine}
        <div class="barcode-area">
          <div class="barcode-rotated" style="width:${lengthMm}mm;height:${thicknessMm}mm">
            ${barcodeSvg}
          </div>
        </div>
        <div class="code">${escapeHtml(label.barcode)}</div>
      </div>
    </section>
  `
}

function buildLabelsHtml(labels: JewelryBarcodeLabel[]): string {
  const pages = labels.map(buildLabelPageHtml).filter(Boolean).join('')

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Kuyumcu Barkod Etiketleri</title>
  <style>
    @page {
      size: ${LABEL_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: ${LABEL_WIDTH_MM}mm;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .label-page {
      width: ${LABEL_WIDTH_MM}mm;
      height: ${LABEL_HEIGHT_MM}mm;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }

    .label-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .label {
      width: ${LABEL_WIDTH_MM}mm;
      height: ${LABEL_HEIGHT_MM}mm;
      padding: ${LABEL_PADDING_V_MM}mm ${LABEL_PADDING_H_MM}mm;
      display: grid;
      grid-template-rows: ${META_ROW_MM}mm 1fr ${CODE_ROW_MM}mm;
      align-items: center;
      justify-items: center;
      text-align: center;
      background: #fff;
      overflow: hidden;
    }

    .meta {
      width: 100%;
      font-size: 2mm;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0.02em;
      color: #000;
    }

    .meta-empty {
      visibility: hidden;
    }

    .code {
      width: 100%;
      font-family: Consolas, Monaco, monospace;
      font-size: 1.6mm;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0;
      word-break: break-all;
      color: #000;
    }

    .barcode-area {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .barcode-rotated {
      flex-shrink: 0;
      transform: rotate(90deg);
      transform-origin: center center;
    }

    .barcode-rotated svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  ${pages}
</body>
</html>`
}

function printHtml(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const frameWindow = iframe.contentWindow
    const doc = frameWindow?.document

    if (!doc || !frameWindow) {
      document.body.removeChild(iframe)
      resolve()
      return
    }

    doc.open()
    doc.write(html)
    doc.close()

    const cleanup = () => {
      window.setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
        resolve()
      }, 300)
    }

    frameWindow.onafterprint = cleanup

    window.setTimeout(() => {
      frameWindow.focus()
      frameWindow.print()

      window.setTimeout(() => {
        if (iframe.parentNode) {
          cleanup()
        }
      }, 5000)
    }, 200)
  })
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

export async function printJewelryBarcodeLabels(labels: JewelryBarcodeLabel[]): Promise<void> {
  const printable = labels.filter((label) => label.barcode?.trim())
  if (printable.length === 0) return

  await printHtml(buildLabelsHtml(printable))
}

export async function printJewelryBarcodeLabel(label: JewelryBarcodeLabel): Promise<void> {
  await printJewelryBarcodeLabels([label])
}
