import { Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import RestaurantDetailPage from '../pages/RestaurantDetailPage'
import RestaurantsPage from '../pages/RestaurantsPage'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<RestaurantsPage />} />
        <Route path="restaurants/:id" element={<RestaurantDetailPage />} />
      </Route>
    </Routes>
  )
}
