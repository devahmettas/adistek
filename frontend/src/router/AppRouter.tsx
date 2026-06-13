import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import MainLayout from '../layouts/MainLayout'
import KitchenMainLayout from '../layouts/KitchenMainLayout'
import WaiterMainLayout from '../layouts/WaiterMainLayout'
import AdminLoginPage from '../pages/AdminLoginPage'
import AdminRestaurantCreatePage from '../pages/AdminRestaurantCreatePage'
import AdminRestaurantDetailPage from '../pages/AdminRestaurantDetailPage'
import AdminRestaurantsPage from '../pages/AdminRestaurantsPage'
import KitchenDashboardPage from '../pages/KitchenDashboardPage'
import KitchenLoginPage from '../pages/KitchenLoginPage'
import LoginPage from '../pages/LoginPage'
import CategoriesPage from '../pages/restaurant/CategoriesPage'
import DashboardPage from '../pages/DashboardPage'
import JewelerBarcodePage from '../pages/jeweler/JewelerBarcodePage'
import JewelerCustomersPage from '../pages/jeweler/JewelerCustomersPage'
import JewelerGoldPricesPage from '../pages/jeweler/JewelerGoldPricesPage'
import JewelerPurchasesPage from '../pages/jeweler/JewelerPurchasesPage'
import JewelerProductsPage from '../pages/jeweler/JewelerProductsPage'
import JewelerRepairsPage from '../pages/jeweler/JewelerRepairsPage'
import JewelerReportsPage from '../pages/jeweler/JewelerReportsPage'
import JewelerSalesPage from '../pages/jeweler/JewelerSalesPage'
import JewelerSettingsPage from '../pages/jeweler/JewelerSettingsPage'
import JewelerVaultPage from '../pages/jeweler/JewelerVaultPage'
import ProductsPage from '../pages/restaurant/ProductsPage'
import StaffPage from '../pages/restaurant/StaffPage'
import PublicMenuLayout from '../layouts/PublicMenuLayout'
import PublicMenuPage from '../pages/PublicMenuPage'
import TableOrderPage from '../pages/TableOrderPage'
import PublicMenuSharePage from '../pages/restaurant/PublicMenuSharePage'
import StatsPage from '../pages/restaurant/StatsPage'
import TablesHomePage from '../pages/restaurant/TablesHomePage'
import ReservationsPage from '../pages/restaurant/ReservationsPage'
import TablesManagePage from '../pages/restaurant/TablesManagePage'
import WaiterDashboardPage from '../pages/WaiterDashboardPage'
import WaiterLoginPage from '../pages/WaiterLoginPage'
import AdminProtectedRoute from './AdminProtectedRoute'
import KitchenProtectedRoute from './KitchenProtectedRoute'
import ProtectedRoute from './ProtectedRoute'
import { JewelerOnlyRoute, RestaurantOnlyRoute } from './BusinessTypeRoute'
import RestaurantFeatureRoute from './RestaurantFeatureRoute'
import WaiterProtectedRoute from './WaiterProtectedRoute'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/waiter/login" element={<WaiterLoginPage />} />
      <Route path="/kitchen/login" element={<KitchenLoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<PublicMenuLayout />}>
        <Route path="/menu/:identifier" element={<PublicMenuPage />} />
        <Route path="/order/:token" element={<TableOrderPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<JewelerOnlyRoute />}>
            <Route path="/dashboard/jeweler/products" element={<JewelerProductsPage />} />
            <Route path="/dashboard/jeweler/purchases" element={<JewelerPurchasesPage />} />
            <Route path="/dashboard/jeweler/vault" element={<JewelerVaultPage />} />
            <Route path="/dashboard/jeweler/stock" element={<Navigate to="/dashboard/jeweler/vault" replace />} />
            <Route path="/dashboard/jeweler/sales" element={<JewelerSalesPage />} />
            <Route path="/dashboard/jeweler/repairs" element={<JewelerRepairsPage />} />
            <Route path="/dashboard/jeweler/customers" element={<JewelerCustomersPage />} />
            <Route path="/dashboard/jeweler/barcode" element={<JewelerBarcodePage />} />
            <Route path="/dashboard/jeweler/gold-prices" element={<JewelerGoldPricesPage />} />
            <Route path="/dashboard/jeweler/reports" element={<JewelerReportsPage />} />
            <Route path="/dashboard/jeweler/settings" element={<JewelerSettingsPage />} />
          </Route>
          <Route element={<RestaurantOnlyRoute />}>
            <Route element={<RestaurantFeatureRoute />}>
              <Route path="/dashboard/masalar" element={<TablesHomePage />} />
              <Route path="/dashboard/stats" element={<StatsPage />} />
              <Route path="/dashboard/menu" element={<PublicMenuSharePage />} />
              <Route path="/dashboard/categories" element={<CategoriesPage />} />
              <Route path="/dashboard/products" element={<ProductsPage />} />
              <Route path="/dashboard/reservations" element={<ReservationsPage />} />
              <Route path="/dashboard/tables" element={<TablesManagePage />} />
              <Route path="/dashboard/staff" element={<StaffPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route element={<WaiterProtectedRoute />}>
        <Route element={<WaiterMainLayout />}>
          <Route path="/waiter/dashboard" element={<WaiterDashboardPage />} />
        </Route>
      </Route>

      <Route element={<KitchenProtectedRoute />}>
        <Route element={<KitchenMainLayout />}>
          <Route path="/kitchen/dashboard" element={<KitchenDashboardPage />} />
        </Route>
      </Route>

      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/restaurants" element={<AdminRestaurantsPage />} />
          <Route path="/admin/restaurants/new" element={<AdminRestaurantCreatePage />} />
          <Route path="/admin/restaurants/:id" element={<AdminRestaurantDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
