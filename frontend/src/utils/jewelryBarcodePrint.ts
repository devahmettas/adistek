import { renderBarcodeSvgString } from './jewelryBarcode'

export interface JewelryBarcodeLabel {
  name: string
  barcode: string
  karat?: number | null
  weightGram?: string | null
  salePrice?: string | number | null
}

/** Şerit ölçüsü: takıya geçirip arkada yapıştırılabilir ince uzun etiket */
export const STRIP_LABEL_WIDTH_MM = 12
export const STRIP_LABEL_HEIGHT_MM = 82

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatPrice(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  const amount = Number(value)
  if (Number.isNaN(amount)) return null
  return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
}

function buildLabelHtml(label: JewelryBarcodeLabel): string {
  const barcodeSvg = renderBarcodeSvgString(label.barcode, 'strip', false)
  if (!barcodeSvg) return ''

  const metaParts = [
    label.karat ? `${label.karat}A` : null,
    label.weightGram ? `${label.weightGram}g` : null,
  ].filter(Boolean)

  const priceLine = formatPrice(label.salePrice)
  const shortName = label.name.length > 18 ? `${label.name.slice(0, 17)}…` : label.name

  return `
    <article class="strip">
      <div class="tab tab-top">YAPIŞTIR</div>

      <div class="panel panel-front">
        <p class="name">${escapeHtml(shortName)}</p>
        ${metaParts.length > 0 ? `<p class="meta">${escapeHtml(metaParts.join(' '))}</p>` : ''}
        <div class="barcode-wrap">
          <div class="barcode">${barcodeSvg}</div>
        </div>
        <p class="code">${escapeHtml(label.barcode)}</p>
        ${priceLine ? `<p class="price">${escapeHtml(priceLine)}</p>` : ''}
      </div>

      <div class="fold">
        <span class="fold-line"></span>
        <span class="fold-text">KATLA · TAKIDAN GEÇİR</span>
        <span class="fold-line"></span>
      </div>

      <div class="panel panel-back">
        <p class="hint">Uçları arkada birleştirin</p>
        <p class="code code-back">${escapeHtml(label.barcode)}</p>
        ${metaParts.length > 0 ? `<p class="meta">${escapeHtml(metaParts.join(' '))}</p>` : ''}
      </div>

      <div class="tab tab-bottom">YAPIŞTIR</div>
    </article>
  `
}

function buildLabelsHtml(labels: JewelryBarcodeLabel[]): string {
  const labelBlocks = labels.map(buildLabelHtml).filter(Boolean).join('')

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Barkod Şerit Etiketleri</title>
  <style>
    @page {
      size: A4;
      margin: 8mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .sheet {
      display: flex;
      flex-wrap: wrap;
      gap: 2.5mm 2mm;
      align-content: flex-start;
    }

    .strip {
      width: ${STRIP_LABEL_WIDTH_MM}mm;
      height: ${STRIP_LABEL_HEIGHT_MM}mm;
      border: 0.15mm dashed #999;
      overflow: hidden;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      text-align: center;
      background: #fff;
    }

    .tab {
      flex: 0 0 7mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      line-height: 1;
      color: #444;
      background: repeating-linear-gradient(
        -45deg,
        #f3f4f6,
        #f3f4f6 1mm,
        #e5e7eb 1mm,
        #e5e7eb 2mm
      );
      border-bottom: 0.1mm solid #ccc;
    }

    .tab-bottom {
      border-bottom: none;
      border-top: 0.1mm solid #ccc;
    }

    .panel {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.8mm 0.6mm;
      min-height: 0;
      overflow: hidden;
    }

    .panel-front {
      gap: 0.4mm;
    }

    .panel-back {
      gap: 0.5mm;
      background: #fafafa;
    }

    .name {
      margin: 0;
      width: 100%;
      font-size: 5.5px;
      font-weight: 700;
      line-height: 1.15;
      word-break: break-word;
      hyphens: auto;
    }

    .meta,
    .price,
    .hint {
      margin: 0;
      width: 100%;
      font-size: 5px;
      line-height: 1.1;
      color: #333;
    }

    .price {
      font-weight: 700;
      font-size: 5.5px;
    }

    .hint {
      font-size: 4.5px;
      color: #666;
    }

    .code {
      margin: 0;
      width: 100%;
      font-family: Consolas, Monaco, monospace;
      font-size: 4.5px;
      line-height: 1.1;
      letter-spacing: 0.02em;
      word-break: break-all;
    }

    .code-back {
      font-weight: 700;
    }

    .barcode-wrap {
      width: 100%;
      height: 18mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .barcode {
      transform: rotate(90deg);
      transform-origin: center center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .barcode svg {
      display: block;
      height: 9mm;
      width: auto;
    }

    .fold {
      flex: 0 0 5mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.3mm;
      padding: 0.2mm 0;
      background: #fff;
    }

    .fold-line {
      display: block;
      width: 72%;
      border-top: 0.2mm dashed #888;
    }

    .fold-text {
      font-size: 3.8px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #555;
      line-height: 1;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      max-height: 4mm;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="sheet">
    ${labelBlocks}
  </div>
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
    }, 150)
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
