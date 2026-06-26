import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import MainLayout from '../layouts/MainLayout'
import AdminLoginPage from '../pages/AdminLoginPage'
import AdminBusinessListPage from '../pages/AdminBusinessListPage'
import AdminDashboardPage from '../pages/AdminDashboardPage'
import AdminRestaurantCreatePage from '../pages/AdminRestaurantCreatePage'
import AdminRestaurantDetailPage from '../pages/AdminRestaurantDetailPage'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import JewelerBarcodePage from '../pages/jeweler/JewelerBarcodePage'
import JewelerCustomersPage from '../pages/jeweler/JewelerCustomersPage'
import JewelerGoldPricesPage from '../pages/jeweler/JewelerGoldPricesPage'
import JewelerPurchasesPage from '../pages/jeweler/JewelerPurchasesPage'
import JewelerTransactionHistoryPage from '../pages/jeweler/JewelerTransactionHistoryPage'
import JewelerProductsPage from '../pages/jeweler/JewelerProductsPage'
import JewelerReportsPage from '../pages/jeweler/JewelerReportsPage'
import JewelerStockCountPage from '../pages/jeweler/JewelerStockCountPage'
import JewelerProfilePage from '../pages/jeweler/JewelerProfilePage'
import JewelerVaultPage from '../pages/jeweler/JewelerVaultPage'
import AdminProtectedRoute from './AdminProtectedRoute'
import ProtectedRoute from './ProtectedRoute'
import JewelerFeatureRoute from './JewelerFeatureRoute'
import JewelerPermissionRoute from './JewelerPermissionRoute'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<JewelerPermissionRoute />}>
            <Route path="/dashboard/jeweler/products" element={<JewelerProductsPage />} />
            <Route path="/dashboard/jeweler/purchases" element={<JewelerPurchasesPage />} />
            <Route path="/dashboard/jeweler/history" element={<JewelerTransactionHistoryPage />} />
            <Route path="/dashboard/jeweler/vault" element={<JewelerVaultPage />} />
            <Route path="/dashboard/jeweler/stock" element={<Navigate to="/dashboard/jeweler/stock-count" replace />} />
            <Route path="/dashboard/jeweler/stock-count" element={<JewelerStockCountPage />} />
            <Route path="/dashboard/jeweler/sales" element={<Navigate to="/dashboard/jeweler/history" replace />} />
            <Route path="/dashboard/jeweler/repairs" element={<Navigate to="/dashboard/jeweler/stock-count" replace />} />
            <Route path="/dashboard/jeweler/customers" element={<JewelerCustomersPage />} />
            <Route element={<JewelerFeatureRoute />}>
              <Route path="/dashboard/jeweler/barcode" element={<JewelerBarcodePage />} />
              <Route path="/dashboard/jeweler/reports" element={<JewelerReportsPage />} />
            </Route>
            <Route path="/dashboard/jeweler/gold-prices" element={<JewelerGoldPricesPage />} />
          </Route>
          <Route path="/dashboard/jeweler/profile" element={<JewelerProfilePage />} />
          <Route path="/dashboard/jeweler/settings" element={<Navigate to="/dashboard/jeweler/profile" replace />} />
        </Route>
      </Route>

      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/restaurants" element={<AdminDashboardPage />} />
          <Route path="/admin/restaurants/list" element={<AdminBusinessListPage />} />
          <Route path="/admin/restaurants/new" element={<AdminRestaurantCreatePage />} />
          <Route path="/admin/restaurants/:id" element={<AdminRestaurantDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
