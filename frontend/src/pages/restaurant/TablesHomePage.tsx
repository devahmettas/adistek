import TableGrid from '../../components/TableGrid'
import { useDashboardData } from '../../context/DashboardContext'
import useNow from '../../hooks/useNow'

export default function TablesHomePage() {
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
    acknowledgeKitchen,
  } = useDashboardData()
  const now = useNow()

  if (loading) {
    return <p className="text-sm text-gray-500">Yükleniyor...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <TableGrid
      tables={tables}
      categories={categories}
      products={products}
      now={now}
      onAddProduct={assignProductToTable}
      onUpdateProduct={updateTableProductQuantity}
      onCancelProduct={cancelTableProduct}
      onChangeStatus={changeTableStatus}
      onRequestBill={requestTableBill}
      onPayBill={payTableBill}
      onAcknowledgeKitchen={acknowledgeKitchen}
      showKitchenAlerts
    />
  )
}
