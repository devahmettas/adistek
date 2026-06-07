import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router/AppRouter'
import { AdminAuthProvider } from './store/AdminAuthStore'
import { AuthProvider } from './store/AuthStore'
import { KitchenAuthProvider } from './store/KitchenAuthStore'
import { WaiterAuthProvider } from './store/WaiterAuthStore'

function App() {
  return (
    <AuthProvider>
      <WaiterAuthProvider>
        <KitchenAuthProvider>
          <AdminAuthProvider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </AdminAuthProvider>
        </KitchenAuthProvider>
      </WaiterAuthProvider>
    </AuthProvider>
  )
}

export default App
