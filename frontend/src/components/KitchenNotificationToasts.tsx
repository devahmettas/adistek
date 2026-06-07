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
          className="pointer-events-auto animate-[slideIn_0.3s_ease-out] overflow-hidden rounded-2xl border border-orange-400/40 bg-gray-900 shadow-2xl ring-1 ring-orange-500/30"
          role="alert"
        >
          <div className="flex items-start gap-3 px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-lg">
              🔔
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-300">
                Yeni Sipariş
              </p>
              <p className="mt-1 text-base font-bold text-white">{notification.tableName}</p>
              <p className="mt-1 text-sm text-gray-200">
                {notification.productName}
                {notification.quantity > 1 && (
                  <span className="ml-1 text-orange-300">x{notification.quantity}</span>
                )}
              </p>
              {notification.note && (
                <p className="mt-1 text-xs italic text-amber-300">Not: {notification.note}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="shrink-0 rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
              aria-label="Bildirimi kapat"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(24px);
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
