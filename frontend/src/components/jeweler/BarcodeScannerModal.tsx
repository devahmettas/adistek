import { useEffect, useId, useRef, useState, type MutableRefObject } from 'react'
import { createPortal } from 'react-dom'
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import Button from '../Button'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { unlockBarcodeScanSound } from '../../utils/barcodeScanSound'
import {
  BARCODE_SCAN_TOAST_STYLES,
  normalizeBarcodeScanFeedback,
  type BarcodeScanFeedback,
} from '../../utils/barcodeScanFeedback'

interface BarcodeScannerModalProps {
  onScan: (barcode: string) => void | Promise<BarcodeScanFeedback | string | null | void>
  onClose: () => void
  /** Tek okumada kapanmak yerine ardışık okumaya izin verir. */
  continuous?: boolean
}

const SCAN_COOLDOWN_MS = 1500
const SCAN_TOAST_MS = 2800

function showScanToast(
  feedback: BarcodeScanFeedback,
  setScanToast: (value: BarcodeScanFeedback | null) => void,
  scanToastTimerRef: MutableRefObject<number | null>,
) {
  setScanToast(feedback)
  if (scanToastTimerRef.current !== null) {
    window.clearTimeout(scanToastTimerRef.current)
  }
  scanToastTimerRef.current = window.setTimeout(() => {
    setScanToast(null)
    scanToastTimerRef.current = null
  }, SCAN_TOAST_MS)
}

/** İnce kuyumcu etiketleri (72×10 mm) için tüm kamera alanı taranır; qrbox sınırlaması yok. */
const SCANNER_CONFIG = {
  fps: 15,
  disableFlip: false,
  aspectRatio: 1.7777778,
}

async function waitForDom(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

async function resolveCameraId(): Promise<string | { facingMode: string }> {
  try {
    const cameras = await Html5Qrcode.getCameras()
    if (cameras.length === 0) {
      return { facingMode: 'environment' }
    }

    const backCamera = cameras.find((camera) => /back|rear|environment|arka/i.test(camera.label))
    if (backCamera) {
      return backCamera.id
    }

    return cameras[cameras.length - 1].id
  } catch {
    return { facingMode: 'environment' }
  }
}

async function startScannerCamera(
  scanner: Html5Qrcode,
  onDecode: (code: string) => void,
): Promise<void> {
  const cameraId = await resolveCameraId()

  try {
    await scanner.start(cameraId, SCANNER_CONFIG, onDecode, () => {})
    return
  } catch {
    // Bazı cihazlarda arka kamera etiketi bulunamaz; ön kamera veya varsayılanı dene.
  }

  if (typeof cameraId === 'string') {
    await scanner.start({ facingMode: 'user' }, SCANNER_CONFIG, onDecode, () => {})
    return
  }

  const cameras = await Html5Qrcode.getCameras()
  if (cameras.length === 0) {
    throw new Error('Kamera bulunamadı')
  }

  await scanner.start(cameras[0].id, SCANNER_CONFIG, onDecode, () => {})
}

async function stopScanner(scanner: Html5Qrcode | null): Promise<void> {
  if (!scanner) return

  try {
    if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
      await scanner.stop()
    }
  } catch {
    // Scanner may already be stopped.
  }

  try {
    scanner.clear()
  } catch {
    // Scanner may already be cleared.
  }
}

export default function BarcodeScannerModal({ onScan, onClose, continuous = false }: BarcodeScannerModalProps) {
  useBodyScrollLock(true)

  const reactId = useId().replace(/:/g, '')
  const readerId = `barcode-scanner-${reactId}`
  const onScanRef = useRef(onScan)
  const onCloseRef = useRef(onClose)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const handledRef = useRef(false)
  const lastScanRef = useRef<{ code: string; at: number } | null>(null)
  const scanToastTimerRef = useRef<number | null>(null)
  const [starting, setStarting] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanToast, setScanToast] = useState<BarcodeScanFeedback | null>(null)

  useEffect(() => {
    void unlockBarcodeScanSound()
  }, [])

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    handledRef.current = false
    lastScanRef.current = null

    const init = async () => {
      await waitForDom()
      if (cancelled) return

      const scanner = new Html5Qrcode(readerId, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      })
      scannerRef.current = scanner

      const onDecode = (decodedText: string) => {
        if (cancelled) return
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

        void (async () => {
          const result = await Promise.resolve(onScanRef.current(code))
          const feedback = normalizeBarcodeScanFeedback(result)

          if (feedback && continuous) {
            showScanToast(feedback, setScanToast, scanToastTimerRef)
            return
          }

          if (!continuous) {
            void stopScanner(scanner).finally(() => onCloseRef.current())
          }
        })()
      }

      try {
        await startScannerCamera(scanner, onDecode)
        if (!cancelled) {
          setStarting(false)
          setCameraError(null)
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : ''
          setCameraError(
            message.includes('Permission') || message.includes('NotAllowed')
              ? 'Kamera izni reddedildi. Tarayıcı ayarlarından izin verin.'
              : 'Kamera açılamadı. HTTPS kullanın ve tarayıcıya kamera izni verin.',
          )
          setStarting(false)
        }
      }
    }

    void init()

    return () => {
      cancelled = true

      if (scanToastTimerRef.current !== null) {
        window.clearTimeout(scanToastTimerRef.current)
        scanToastTimerRef.current = null
      }

      const current = scannerRef.current
      scannerRef.current = null
      void stopScanner(current)
    }
  }, [continuous, readerId])

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-x-hidden overscroll-behavior-contain bg-slate-950"
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
        <Button type="button" variant="secondary" size="sm" onClick={() => onCloseRef.current()}>
          Kapat
        </Button>
      </div>

      {scanToast && (
        <div
          className={`pointer-events-none absolute right-4 top-[4.25rem] z-10 max-w-[min(20rem,calc(100vw-2rem))] animate-[staffToastIn_0.25s_ease-out] rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-lg ring-1 ${BARCODE_SCAN_TOAST_STYLES[scanToast.tone]}`}
        >
          {scanToast.message}
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-4">
        <div
          id={readerId}
          className="min-h-[220px] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl [&_video]:min-h-[220px] [&_video]:w-full [&_video]:rounded-2xl [&_video]:object-cover"
        />

        <div
          className="pointer-events-none absolute inset-x-3 top-1/2 mx-auto w-[94%] max-w-lg -translate-y-1/2 rounded-lg border-2 border-amber-300/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.35)]"
          style={{ aspectRatio: '7 / 1' }}
        />

        {starting && !cameraError && (
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
          : 'İnce etiketi yatay hizalayın; telefonu yaklaştırın veya uzaklaştırın. Okuma otomatik yapılır.'}
      </div>

      <style>{`
        @keyframes staffToastIn {
          from {
            opacity: 0;
            transform: translateX(16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )

  return createPortal(modal, document.body)
}
