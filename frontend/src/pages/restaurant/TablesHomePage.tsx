import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
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
    partialPayTableBill,
    acknowledgeKitchen,
  } = useDashboardData()
  const now = useNow()

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Masalar"
          description="Canlı masa durumlarını takip edin, siparişleri yönetin."
        />
        <LoadingState />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Masalar" />
        <p className="alert-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Masalar"
        description="Canlı masa durumlarını takip edin, sipariş ekleyin ve hesap işlemlerini yönetin."
      />
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
        onPayBill={async (tableId, paymentMethod) => {
          await payTableBill(tableId, paymentMethod)
        }}
        onPartialPayBill={partialPayTableBill}
        onAcknowledgeKitchen={acknowledgeKitchen}
      />
    </div>
  )
}
