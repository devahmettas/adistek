import { useCallback, useEffect, useMemo, useState } from 'react'
import { getKitchenOrders, dismissKitchenCancelled, markKitchenOrderReady } from '../api/kitchenOrders'
import type { KitchenOrder } from '../api/types'
import Button from '../components/Button'
import KitchenEmptyState from '../components/kitchen/KitchenEmptyState'
import KitchenOrderCard from '../components/kitchen/KitchenOrderCard'
import KitchenPrintSettings from '../components/kitchen/KitchenPrintSettings'
import KitchenStatsBar from '../components/kitchen/KitchenStatsBar'
import KitchenNotificationToasts from '../components/KitchenNotificationToasts'
import LoadingState from '../components/LoadingState'
import PageHeader from '../components/PageHeader'
import { useKitchenOrderNotifications } from '../hooks/useKitchenOrderNotifications'
import { useKitchenAuth } from '../store/KitchenAuthStore'
import { unlockKitchenNotificationSound } from '../utils/kitchenNotificationSound'

function countItems(orders: KitchenOrder[], status: 'pending' | 'ready' | 'cancelled') {
  return orders.reduce(
    (sum, order) => sum + order.items.filter((item) => item.kitchen_status === status).length,
    0,
  )
}

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
    useKitchenOrderNotifications(orders, {
      restaurantName: kitchenStaff?.restaurant?.name,
    })

  const stats = useMemo(
    () => ({
      pending: countItems(orders, 'pending'),
      ready: countItems(orders, 'ready'),
      cancelled: countItems(orders, 'cancelled'),
      tables: orders.length,
    }),
    [orders],
  )

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
          title={kitchenStaff?.restaurant?.name ?? 'Mutfak'}
          description="Bekleyen ürünleri hazırlayın ve Hazır butonuna basın. Garson masaya teslim edecektir. Sayfa 5 saniyede bir yenilenir."
          actions={
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-card">
              <p className="font-semibold text-slate-900">{kitchenStaff?.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">Otomatik yenileme: 5 sn</p>
            </div>
          }
        />

        {!loading && (
          <KitchenStatsBar
            pendingCount={stats.pending}
            readyCount={stats.ready}
            cancelledCount={stats.cancelled}
            tableCount={stats.tables}
          />
        )}

        <KitchenPrintSettings restaurantName={kitchenStaff?.restaurant?.name} />

        {needsSoundUnlock && (
          <div className="alert-warning">
            <p className="text-sm">
              Tarayıcı bildirim sesini engelliyor olabilir. Yeni siparişleri kaçırmamak için sesi
              açın.
            </p>
            <Button type="button" onClick={enableSound} className="mt-3">
              Bildirim Sesini Aç
            </Button>
          </div>
        )}

        {loading && <LoadingState label="Siparişler yükleniyor..." />}
        {error && <p className="alert-error">{error}</p>}

        {!loading && orders.length === 0 && <KitchenEmptyState />}

        {!loading && orders.length > 0 && (
          <div className="grid gap-5 xl:grid-cols-2">
            {orders.map((order) => (
              <KitchenOrderCard
                key={order.table_id}
                order={order}
                submittingId={submittingId}
                restaurantName={kitchenStaff?.restaurant?.name}
                onMarkReady={handleMarkReady}
                onDismissCancelled={handleDismissCancelled}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
