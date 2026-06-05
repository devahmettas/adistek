import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import MainLayout from '../layouts/MainLayout'
import WaiterMainLayout from '../layouts/WaiterMainLayout'
import AdminLoginPage from '../pages/AdminLoginPage'
import AdminRestaurantsPage from '../pages/AdminRestaurantsPage'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import WaiterDashboardPage from '../pages/WaiterDashboardPage'
import WaiterLoginPage from '../pages/WaiterLoginPage'
import AdminProtectedRoute from './AdminProtectedRoute'
import ProtectedRoute from './ProtectedRoute'
import WaiterProtectedRoute from './WaiterProtectedRoute'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/waiter/login" element={<WaiterLoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route element={<WaiterProtectedRoute />}>
        <Route element={<WaiterMainLayout />}>
          <Route path="/waiter/dashboard" element={<WaiterDashboardPage />} />
        </Route>
      </Route>

      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/restaurants" element={<AdminRestaurantsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
