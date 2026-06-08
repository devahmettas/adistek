import { useCallback, useEffect, useState } from 'react'
import { getKitchenOrders, dismissKitchenCancelled, markKitchenOrderReady } from '../api/kitchenOrders'
import type { KitchenOrder } from '../api/types'
import Button from '../components/Button'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import PageHeader from '../components/PageHeader'
import KitchenNotificationToasts from '../components/KitchenNotificationToasts'
import { useKitchenOrderNotifications } from '../hooks/useKitchenOrderNotifications'
import { useKitchenAuth } from '../store/KitchenAuthStore'
import { unlockKitchenNotificationSound } from '../utils/kitchenNotificationSound'

export default function KitchenDashboardPage() {
  const { kitchenStaff } = useKitchenAuth()
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      setOrders(await getKitchenOrders())
    } catch {
      if (!silent) {
        setError('Siparişler yüklenemedi.')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  const { notifications, dismissNotification, needsSoundUnlock, enableSound } =
    useKitchenOrderNotifications(orders)

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadOrders(true)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [loadOrders])

  useEffect(() => {
    const unlockOnInteraction = () => {
      void unlockKitchenNotificationSound()
    }

    window.addEventListener('click', unlockOnInteraction, { once: true })
    window.addEventListener('keydown', unlockOnInteraction, { once: true })

    return () => {
      window.removeEventListener('click', unlockOnInteraction)
      window.removeEventListener('keydown', unlockOnInteraction)
    }
  }, [])

  useEffect(() => {
    const timeouts = notifications.map((notification) =>
      window.setTimeout(() => {
        dismissNotification(notification.id)
      }, 10000),
    )

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout))
    }
  }, [notifications, dismissNotification])

  const handleMarkReady = async (pivotId: number) => {
    setSubmittingId(pivotId)

    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        items: order.items.map((item) =>
          item.pivot_id === pivotId ? { ...item, kitchen_status: 'ready' as const } : item,
        ),
      })),
    )

    try {
      await markKitchenOrderReady(pivotId)
      await loadOrders(true)
    } catch {
      await loadOrders(true)
      window.alert('Sipariş hazır olarak işaretlenemedi.')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleDismissCancelled = async (pivotId: number) => {
    setSubmittingId(pivotId)

    try {
      await dismissKitchenCancelled(pivotId)
      await loadOrders(true)
    } catch {
      await loadOrders(true)
      window.alert('İptal bildirimi kapatılamadı.')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <>
      <KitchenNotificationToasts
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <div className="space-y-6">
        <PageHeader
          dark
          title={kitchenStaff?.restaurant?.name ?? 'Mutfak'}
          description="Bekleyen siparişler otomatik yenilenir. Yeni siparişlerde sesli bildirim çalar."
        />

        {needsSoundUnlock && (
          <div className="rounded-2xl border border-brand-500/30 bg-brand-950/30 px-4 py-3">
            <p className="text-sm text-brand-100">
              Tarayıcı bildirim sesini engelliyor olabilir. Sesi etkinleştirmek için aşağıdaki
              butona tıklayın.
            </p>
            <Button type="button" onClick={enableSound} className="mt-3">
              Bildirim Sesini Aç
            </Button>
          </div>
        )}

        {loading && <LoadingState dark />}
        {error && <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</p>}

        {!loading && orders.length === 0 && (
          <Card title="Bekleyen Sipariş Yok">
            <p className="text-sm text-gray-500">Şu an mutfağa düşmüş sipariş bulunmuyor.</p>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((order) => (
            <div
              key={order.table_id}
              className="rounded-2xl border border-brand-500/30 bg-slate-900 p-5 shadow-panel"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-brand-300">{order.table_name}</h2>
                <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-200">
                  {order.items.length} kalem
                </span>
              </div>

              <div className="space-y-3">
                {order.items.map((item) => {
                  const isReady = item.kitchen_status === 'ready'
                  const isCancelled = item.kitchen_status === 'cancelled'
                  const isPending = item.kitchen_status === 'pending'

                  return (
                    <div
                      key={item.pivot_id}
                      className={`rounded-xl border p-4 transition ${
                        isCancelled
                          ? 'border-red-500/60 bg-red-950/40'
                          : isReady
                            ? 'border-emerald-500/60 bg-emerald-950/40'
                            : isPending
                              ? 'border-orange-500/60 bg-orange-950/20 ring-1 ring-orange-500/20'
                              : 'border-gray-700 bg-gray-800/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={isReady || isCancelled ? 'opacity-80' : undefined}>
                          {isCancelled && (
                            <span className="mb-2 inline-flex rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-red-300">
                              İptal Edildi
                            </span>
                          )}
                          {isPending && (
                            <span className="mb-2 inline-flex rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-orange-300">
                              Yeni
                            </span>
                          )}
                          <p
                            className={`text-lg font-semibold ${
                              isCancelled
                                ? 'text-red-200 line-through decoration-red-400'
                                : isReady
                                  ? 'text-emerald-100 line-through decoration-emerald-400'
                                  : 'text-white'
                            }`}
                          >
                            {item.product_name}
                            {item.quantity > 1 && (
                              <span className="ml-2 text-sm font-normal text-gray-400">
                                x{item.quantity}
                              </span>
                            )}
                          </p>
                          {item.description && (
                            <p
                              className={`mt-1 text-sm ${isReady ? 'text-emerald-200/70' : 'text-gray-300'}`}
                            >
                              {item.description}
                            </p>
                          )}
                          {item.note && (
                            <p className="mt-1 text-sm italic text-amber-300">Not: {item.note}</p>
                          )}
                        </div>
                        {isCancelled ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleDismissCancelled(item.pivot_id)}
                            disabled={submittingId === item.pivot_id}
                            className="shrink-0 border-red-400/40 bg-red-950/60 text-red-200 hover:bg-red-900/60"
                          >
                            {submittingId === item.pivot_id ? '...' : 'Tamam'}
                          </Button>
                        ) : isReady ? (
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl font-bold text-white shadow-md"
                            aria-label="Hazır"
                          >
                            ✓
                          </div>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => handleMarkReady(item.pivot_id)}
                            disabled={submittingId === item.pivot_id}
                            className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
                          >
                            {submittingId === item.pivot_id ? '...' : 'Hazır'}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
