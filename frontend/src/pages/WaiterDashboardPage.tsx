import Card from '../components/Card'
import TableGrid from '../components/TableGrid'
import useWaiterDashboard from '../hooks/useWaiterDashboard'
import useNow from '../hooks/useNow'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {waiter?.restaurant?.name ?? 'Restoran'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Garson: <span className="font-medium text-gray-900">{waiter?.name}</span>
        </p>
      </div>

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
  )
}
