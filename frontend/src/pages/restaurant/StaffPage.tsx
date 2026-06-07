import Card from '../../components/Card'
import KitchenStaffList from '../../components/KitchenStaffList'
import WaiterList from '../../components/WaiterList'
import { useDashboardData } from '../../context/DashboardContext'

export default function StaffPage() {
  const { loading, error } = useDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Personel</h1>
        <p className="mt-1 text-sm text-gray-600">Garson ve mutfak çalışanlarını yönetin.</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && (
        <>
          <Card title="Garsonlar">
            <WaiterList />
          </Card>

          <Card title="Mutfak Çalışanları">
            <KitchenStaffList />
          </Card>
        </>
      )}
    </div>
  )
}
