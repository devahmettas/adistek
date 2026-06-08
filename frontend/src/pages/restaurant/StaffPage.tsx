import Card from '../../components/Card'
import KitchenStaffList from '../../components/KitchenStaffList'
import LoadingState from '../../components/LoadingState'
import PageHeader from '../../components/PageHeader'
import WaiterList from '../../components/WaiterList'
import { useDashboardData } from '../../context/DashboardContext'

export default function StaffPage() {
  const { loading, error } = useDashboardData()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personel"
        description="Garson ve mutfak ekibinizi yönetin, giriş bilgilerini düzenleyin."
      />

      {loading && <LoadingState />}
      {error && <p className="alert-error">{error}</p>}

      {!loading && (
        <>
          <Card title="Garsonlar" description="Masa ve sipariş yönetimi için garson hesapları.">
            <WaiterList />
          </Card>

          <Card title="Mutfak Çalışanları" description="Sipariş hazırlık paneline erişim verin.">
            <KitchenStaffList />
          </Card>
        </>
      )}
    </div>
  )
}
