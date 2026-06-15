import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

type BarcodeSize = 'xs' | 'sm' | 'md'
type BarcodeCorner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

interface ProductBarcodeProps {
  value: string | null | undefined
  size?: BarcodeSize
  corner?: BarcodeCorner
  showValue?: boolean
  className?: string
}

const SIZE_OPTIONS: Record<BarcodeSize, { width: number; height: number; fontSize: number }> = {
  xs: { width: 0.55, height: 14, fontSize: 7 },
  sm: { width: 0.75, height: 22, fontSize: 9 },
  md: { width: 1, height: 32, fontSize: 11 },
}

const CORNER_CLASSES: Record<BarcodeCorner, string> = {
  'top-right': 'right-1.5 top-1.5',
  'top-left': 'left-1.5 top-1.5',
  'bottom-right': 'right-1.5 bottom-1.5',
  'bottom-left': 'left-1.5 bottom-1.5',
}

export default function ProductBarcode({
  value,
  size = 'xs',
  corner,
  showValue = false,
  className = '',
}: ProductBarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const trimmed = value?.trim()

  useEffect(() => {
    if (!svgRef.current || !trimmed) return

    try {
      const options = SIZE_OPTIONS[size]
      JsBarcode(svgRef.current, trimmed, {
        format: 'CODE128',
        width: options.width,
        height: options.height,
        displayValue: showValue,
        fontSize: options.fontSize,
        margin: 0,
        background: 'transparent',
        lineColor: '#334155',
      })
    } catch {
      svgRef.current.innerHTML = ''
    }
  }, [trimmed, size, showValue])

  if (!trimmed) return null

  const barcode = (
    <svg
      ref={svgRef}
      role="img"
      aria-label={`Barkod: ${trimmed}`}
      className={`max-w-full ${corner ? 'h-auto w-[52px] sm:w-[58px]' : ''} ${className}`}
    />
  )

  if (!corner) {
    return barcode
  }

  return (
    <div
      className={`pointer-events-none absolute z-[1] rounded-md border border-slate-200/60 bg-white/85 px-1 py-0.5 shadow-sm backdrop-blur-[1px] ${CORNER_CLASSES[corner]}`}
      title={trimmed}
    >
      {barcode}
    </div>
  )
}
