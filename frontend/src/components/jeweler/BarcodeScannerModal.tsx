import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import Button from '../Button'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface BarcodeScannerModalProps {
  onScan: (barcode: string) => void
  onClose: () => void
  /** Tek okumada kapanmak yerine ardışık okumaya izin verir. */
  continuous?: boolean
}

const SCAN_COOLDOWN_MS = 1500

export default function BarcodeScannerModal({ onScan, onClose, continuous = false }: BarcodeScannerModalProps) {
  useBodyScrollLock(true)

  const readerId = useId().replace(/:/g, '')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const handledRef = useRef(false)
  const lastScanRef = useRef<{ code: string; at: number } | null>(null)
  const [starting, setStarting] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const scanner = new Html5Qrcode(readerId, {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
    })
    scannerRef.current = scanner

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            aspectRatio: 1.777778,
            disableFlip: false,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const width = Math.min(viewfinderWidth * 0.88, 340)
              const height = Math.min(viewfinderHeight * 0.42, 140)
              return { width, height }
            },
          },
          (decodedText) => {
            if (!active) return
            if (!continuous && handledRef.current) return

            const code = decodedText.trim()
            if (!code) return

            const now = Date.now()
            if (
              lastScanRef.current?.code === code
              && now - lastScanRef.current.at < SCAN_COOLDOWN_MS
            ) {
              return
            }
            lastScanRef.current = { code, at: now }

            if (!continuous) {
              handledRef.current = true
            }

            if (navigator.vibrate) {
              navigator.vibrate(80)
            }

            onScan(code)

            if (continuous) return

            const stop = async () => {
              if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
                await scanner.stop()
              }
            }

            void stop().finally(onClose)
          },
          () => {},
        )

        if (active) {
          setStarting(false)
        }
      } catch {
        if (active) {
          setCameraError('Kamera açılamadı. Tarayıcı izni verildiğinden emin olun.')
          setStarting(false)
        }
      }
    }

    void startScanner()

    return () => {
      active = false
      const current = scannerRef.current
      scannerRef.current = null

      if (!current) return

      if (current.getState() === Html5QrcodeScannerState.SCANNING) {
        void current.stop().catch(() => {})
      }

      try {
        current.clear()
      } catch {
        // Scanner may already be cleared.
      }
    }
  }, [continuous, onClose, onScan, readerId])

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col overflow-x-hidden overscroll-behavior-contain bg-slate-950"
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-scanner-title"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
        <div>
          <h2 id="barcode-scanner-title" className="text-base font-bold">
            Ürün Okut
          </h2>
          <p className="text-xs text-slate-300">
            {continuous ? 'Ürünleri arka arkaya okutabilirsiniz' : 'Barkodu kameranın önüne getirin'}
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Kapat
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-4">
        <div
          id={readerId}
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl [&_video]:rounded-2xl"
        />

        <div className="pointer-events-none absolute inset-x-4 top-1/2 mx-auto max-w-lg -translate-y-1/2 rounded-xl border-2 border-amber-300/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.35)]" style={{ aspectRatio: '2.4 / 1' }} />

        {starting && (
          <p className="mt-4 text-sm text-slate-300">Kamera başlatılıyor...</p>
        )}

        {cameraError && (
          <div className="mt-4 max-w-md rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-center text-sm text-red-100">
            {cameraError}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">
        {continuous
          ? 'Kamera açık kaldığı sürece her barkod otomatik sayılır. Bitince Kapat\'a basın.'
          : 'Telefonu barkoda yaklaştırın. Okuma otomatik yapılır.'}
      </div>
    </div>
  )
}
