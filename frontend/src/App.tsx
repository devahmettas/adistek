import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router/AppRouter'
import { AdminAuthProvider } from './store/AdminAuthStore'
import { AuthProvider } from './store/AuthStore'

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AdminAuthProvider>
    </AuthProvider>
  )
}

export default App
