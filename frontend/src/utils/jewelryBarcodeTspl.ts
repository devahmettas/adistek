import {
  buildLabelLayout,
  LABEL_HEIGHT_MM,
  LABEL_WIDTH_MM,
  type JewelryBarcodeLabel,
} from './jewelryBarcodeLabelLayout'

function escapeTsplString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function rightAlignTextX(
  columnX: number,
  columnWidth: number,
  text: string,
  font: string,
  xMul: number,
): number {
  const charWidth = font === '1' ? 8 : 8
  const textWidth = text.length * charWidth * xMul
  return columnX + Math.max(0, columnWidth - textWidth - 2)
}

export function buildJewelryBarcodeTspl(label: JewelryBarcodeLabel): string {
  const layout = buildLabelLayout(label)
  const barcodeX = layout.barcodeX
  const barcodeNumberX = layout.barcodeNumberX

  const infoLines = [
    layout.productName,
    layout.gramLine,
    layout.ayarLine,
  ].filter(Boolean)

  const textCommands = infoLines
    .map((line, index) => {
      const y = layout.infoStartY + index * layout.infoLineHeight
      const x = rightAlignTextX(
        layout.infoColumnX,
        layout.infoColumnWidth,
        line,
        layout.infoFont,
        layout.infoXMul,
      )
      return `TEXT ${x},${y},"${layout.infoFont}",0,${layout.infoXMul},${layout.infoYMul},"${escapeTsplString(line)}"`
    })
    .join('\n')

  return [
    `SIZE ${LABEL_WIDTH_MM} mm,${LABEL_HEIGHT_MM} mm`,
    'GAP 0 mm,0 mm',
    'DIRECTION 1',
    'REFERENCE 0,0',
    'OFFSET 0 mm',
    'SET PEEL OFF',
    'SET CUTTER OFF',
    'SET PARTIAL_CUTTER OFF',
    'SET TEAR ON',
    'DENSITY 8',
    'SPEED 3',
    'CLS',
    `BARCODE ${barcodeX},${layout.barcodeY},"128",${layout.barcodeHeight},0,0,${layout.barcodeNarrow},${layout.barcodeWide},"${escapeTsplString(label.barcode)}"`,
    `TEXT ${barcodeNumberX},${layout.barcodeNumberY},"${layout.barcodeNumberFont}",0,${layout.barcodeNumberXMul},${layout.barcodeNumberYMul},"${escapeTsplString(label.barcode)}"`,
    textCommands,
    'PRINT 1,1',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildJewelryBarcodeTsplBatch(labels: JewelryBarcodeLabel[]): string {
  return labels
    .map((label) => buildJewelryBarcodeTspl(label))
    .join('\n')
}
