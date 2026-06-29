import { renderBarcodeSvgForLabel } from './jewelryBarcode'
import {
  buildLabelLayout,
  LABEL_BARCODE_SHIFT_MM,
  LABEL_BODY_WIDTH_MM,
  LABEL_HEIGHT_MM,
  LABEL_MARGIN_MM,
  LABEL_TAIL_SAFE_GAP_MM,
  LABEL_TAIL_WIDTH_MM,
  LABEL_WIDTH_MM,
  type JewelryBarcodeLabel,
} from './jewelryBarcodeLabelLayout'

export {
  LABEL_BODY_WIDTH_MM,
  LABEL_HEIGHT_MM,
  LABEL_TAIL_WIDTH_MM,
  LABEL_WIDTH_MM,
  toJewelryBarcodeLabel,
  type JewelryBarcodeLabel,
} from './jewelryBarcodeLabelLayout'

export { buildJewelryBarcodeTspl, buildJewelryBarcodeTsplBatch } from './jewelryBarcodeTspl'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildLabelPageHtml(label: JewelryBarcodeLabel): string {
  const layout = buildLabelLayout(label)
  const barcodeWidthMm = layout.barcodeWidth / 8
  const barcodeBlockWidthMm = layout.barcodeBlockWidth / 8
  const barcodeHeightMm = layout.barcodeHeight / 8
  const barcodeSvg = renderBarcodeSvgForLabel(
    label.barcode,
    barcodeWidthMm,
    barcodeHeightMm,
    layout.barcodeNarrow / 8,
    layout.barcodeWide / 8,
  )
  if (!barcodeSvg) return ''

  const infoLines = [
    layout.productName,
    layout.gramLine,
    layout.ayarLine,
  ].filter(Boolean)

  const infoHtml = infoLines
    .map((line) => `<div class="info-line">${escapeHtml(line)}</div>`)
    .join('')

  return `
    <section class="label-page">
      <div class="label">
        <div class="tail" aria-hidden="true"></div>
        <div class="body">
          <div class="barcode-col">
            <div class="barcode-block" style="width:${barcodeBlockWidthMm}mm">
              <div class="barcode-wrap" style="height:${barcodeHeightMm}mm;width:${barcodeWidthMm}mm">
                ${barcodeSvg}
              </div>
              <div class="barcode-no">${escapeHtml(label.barcode)}</div>
            </div>
          </div>
          <div class="info-col">
            ${infoHtml}
          </div>
        </div>
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
      font-weight: 400;
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
      display: flex;
      background: #fff;
      overflow: hidden;
    }

    .body {
      width: ${LABEL_BODY_WIDTH_MM}mm;
      height: ${LABEL_HEIGHT_MM}mm;
      padding: ${LABEL_MARGIN_MM}mm;
      padding-left: ${LABEL_TAIL_SAFE_GAP_MM + LABEL_MARGIN_MM}mm;
      display: flex;
      gap: 1mm;
      align-items: stretch;
      overflow: hidden;
    }

    .tail {
      width: ${LABEL_TAIL_WIDTH_MM}mm;
      height: ${LABEL_HEIGHT_MM}mm;
      flex-shrink: 0;
      background: #fff;
    }

    .barcode-col {
      flex: 0 0 45%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      overflow: visible;
    }

    .barcode-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translateX(${LABEL_BARCODE_SHIFT_MM}mm);
      gap: 0.2mm;
      overflow: visible;
    }

    .info-col {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-end;
      gap: 0.2mm;
      overflow: hidden;
      text-align: right;
    }

    .barcode-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .barcode-wrap svg {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
    }

    .barcode-no {
      width: 100%;
      text-align: center;
      font-size: 1.7mm;
      font-weight: 400;
      line-height: 1.1;
      letter-spacing: 0.02em;
      color: #000;
      white-space: nowrap;
      overflow: visible;
    }

    .info-line {
      font-size: 2mm;
      font-weight: 400;
      line-height: 1.15;
      color: #000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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

export async function printJewelryBarcodeLabels(labels: JewelryBarcodeLabel[]): Promise<void> {
  const printable = labels.filter((label) => label.barcode?.trim())
  if (printable.length === 0) return

  await printHtml(buildLabelsHtml(printable))
}

export async function printJewelryBarcodeLabel(label: JewelryBarcodeLabel): Promise<void> {
  await printJewelryBarcodeLabels([label])
}
