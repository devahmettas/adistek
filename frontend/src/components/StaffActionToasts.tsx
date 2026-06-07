import { useCallback, useState } from 'react'

export type StaffToastType = 'success' | 'error' | 'warning'

export interface StaffToast {
  id: string
  type: StaffToastType
  message: string
}

const TOAST_STYLES: Record<StaffToastType, string> = {
  success: 'border-emerald-400/50 bg-emerald-50 text-emerald-900 ring-emerald-200',
  error: 'border-red-400/50 bg-red-50 text-red-900 ring-red-200',
  warning: 'border-amber-400/50 bg-amber-50 text-amber-900 ring-amber-200',
}

const TOAST_ICONS: Record<StaffToastType, string> = {
  success: '✓',
  error: '!',
  warning: '−',
}

export function useStaffToasts(autoDismissMs = 3200) {
  const [toasts, setToasts] = useState<StaffToast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (type: StaffToastType, message: string) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, type, message }])

      window.setTimeout(() => {
        dismissToast(id)
      }, autoDismissMs)
    },
    [autoDismissMs, dismissToast],
  )

  return { toasts, pushToast, dismissToast }
}

interface StaffActionToastsProps {
  toasts: StaffToast[]
  onDismiss: (id: string) => void
}

export default function StaffActionToasts({ toasts, onDismiss }: StaffActionToastsProps) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-[staffToastIn_0.25s_ease-out] rounded-xl border px-4 py-3 shadow-lg ring-1 ${TOAST_STYLES[toast.type]}`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold">
              {TOAST_ICONS[toast.type]}
            </span>
            <p className="min-w-0 flex-1 pt-0.5 text-sm font-semibold leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded-md px-1.5 py-0.5 text-sm opacity-60 hover:opacity-100"
              aria-label="Kapat"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

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
}
