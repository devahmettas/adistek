import { useEffect } from 'react'
import Button from '../components/Button'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import PageHeader from '../components/PageHeader'
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
    partialPayTableBill,
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
        <PageHeader
          title={waiter?.restaurant?.name ?? 'Restoran'}
          description={`Garson: ${waiter?.name ?? '—'} · Mutfak siparişi hazır olunca sesli bildirim alırsınız.`}
        />

        {needsSoundUnlock && (
          <div className="alert-warning">
            <p className="text-sm">
              Tarayıcı bildirim sesini engelliyor olabilir. Sesi etkinleştirmek için aşağıdaki
              butona tıklayın.
            </p>
            <Button type="button" onClick={enableSound} className="mt-3">
              Bildirim Sesini Aç
            </Button>
          </div>
        )}

        {loading && <LoadingState />}
        {error && <p className="alert-error">{error}</p>}

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
              onPayBill={async (tableId, paymentMethod) => {
                await payTableBill(tableId, paymentMethod)
              }}
              onPartialPayBill={partialPayTableBill}
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
