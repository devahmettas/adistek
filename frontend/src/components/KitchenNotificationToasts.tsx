import type { KitchenNotification } from '../hooks/useKitchenOrderNotifications'

interface KitchenNotificationToastsProps {
  notifications: KitchenNotification[]
  onDismiss: (id: string) => void
}

export default function KitchenNotificationToasts({
  notifications,
  onDismiss,
}: KitchenNotificationToastsProps) {
  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="pointer-events-auto animate-[kitchenToastIn_0.35s_ease-out] overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-panel"
          role="alert"
        >
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800">
              Yeni sipariş
            </p>
          </div>

          <div className="flex items-start gap-3 px-4 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">
              🔔
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-slate-900">{notification.tableName}</p>
              <p className="mt-1 text-sm text-slate-700">
                {notification.productName}
                {notification.quantity > 1 && (
                  <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                    x{notification.quantity}
                  </span>
                )}
              </p>
              {notification.note && (
                <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
                  Not: {notification.note}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Bildirimi kapat"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
