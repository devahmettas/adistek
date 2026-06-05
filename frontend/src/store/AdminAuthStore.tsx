import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { adminLogin, adminLogout, getAdminMe } from '../api/adminAuth'
import { ADMIN_TOKEN_KEY } from '../api/adminClient'
import type { Admin } from '../api/types'

interface AdminAuthContextValue {
  admin: Admin | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  const persistAuth = (token: string, authAdmin: Admin) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token)
    setAdmin(authAdmin)
  }

  const clearAuth = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setAdmin(null)
  }

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)

    if (!token) {
      setLoading(false)
      return
    }

    try {
      const me = await getAdminMe()
      setAdmin(me)
    } catch {
      clearAuth()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = async (email: string, password: string) => {
    const data = await adminLogin(email, password)
    persistAuth(data.token, data.admin)
  }

  const logout = async () => {
    try {
      await adminLogout()
    } catch {
      // Token may already be invalid; still clear local session.
    } finally {
      clearAuth()
    }
  }

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: !!admin,
      loading,
      login,
      logout,
    }),
    [admin, loading],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }

  return context
}
