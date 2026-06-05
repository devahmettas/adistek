import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router/AppRouter'
import { AdminAuthProvider } from './store/AdminAuthStore'
import { AuthProvider } from './store/AuthStore'
import { WaiterAuthProvider } from './store/WaiterAuthStore'

function App() {
  return (
    <AuthProvider>
      <WaiterAuthProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </AdminAuthProvider>
      </WaiterAuthProvider>
    </AuthProvider>
  )
}

export default App
