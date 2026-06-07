import { useEffect } from 'react'
import Button from '../components/Button'
import Card from '../components/Card'
import TableGrid from '../components/TableGrid'
import WaiterReadyNotificationToasts from '../components/WaiterReadyNotificationToasts'
import useWaiterDashboard from '../hooks/useWaiterDashboard'
import { useWaiterReadyNotifications } from '../hooks/useWaiterReadyNotifications'
import useNow from '../hooks/useNow'
import { unlockKitchenNotificationSound } from '../utils/kitchenNotificationSound'
import { useWaiterAuth } from '../store/WaiterAuthStore'

export default function WaiterDashboardPage() {
  const { waiter } = useWaiterAuth()
  const {
    categories,
    products,
    tables,
    loading,
    error,
    assignProductToTable,
    updateTableProductQuantity,
    cancelTableProduct,
    changeTableStatus,
    requestTableBill,
    payTableBill,
    claimView,
    acknowledgeKitchen,
  } = useWaiterDashboard()
  const now = useNow()

  const { notifications, dismissNotification, needsSoundUnlock, enableSound } =
    useWaiterReadyNotifications(tables, waiter?.id)

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

  return (
    <>
      <WaiterReadyNotificationToasts
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {waiter?.restaurant?.name ?? 'Restoran'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Garson: <span className="font-medium text-gray-900">{waiter?.name}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Mutfak siparişi hazır olunca sesli bildirim alırsınız.
          </p>
        </div>

        {needsSoundUnlock && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-900">
              Tarayıcı bildirim sesini engelliyor olabilir. Sesi etkinleştirmek için aşağıdaki
              butona tıklayın.
            </p>
            <Button type="button" onClick={enableSound} className="mt-3">
              Bildirim Sesini Aç
            </Button>
          </div>
        )}

        {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && (
          <Card title="Masalar">
            <TableGrid
              tables={tables}
              categories={categories}
              products={products}
              now={now}
              isWaiter
              onAddProduct={assignProductToTable}
              onUpdateProduct={updateTableProductQuantity}
              onCancelProduct={cancelTableProduct}
              onChangeStatus={changeTableStatus}
              onRequestBill={requestTableBill}
              onPayBill={payTableBill}
              onClaimView={claimView}
              onAcknowledgeKitchen={acknowledgeKitchen}
              showKitchenAlerts
            />
          </Card>
        )}
      </div>
    </>
  )
}
