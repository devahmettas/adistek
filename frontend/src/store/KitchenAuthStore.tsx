import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getKitchenMe, kitchenLogin as loginRequest, kitchenLogout as logoutRequest } from '../api/kitchenAuth'
import { KITCHEN_TOKEN_KEY } from '../api/kitchenClient'
import type { KitchenStaff } from '../api/types'

interface KitchenAuthContextValue {
  kitchenStaff: KitchenStaff | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const KitchenAuthContext = createContext<KitchenAuthContextValue | null>(null)

export function KitchenAuthProvider({ children }: { children: ReactNode }) {
  const [kitchenStaff, setKitchenStaff] = useState<KitchenStaff | null>(null)
  const [loading, setLoading] = useState(true)

  const persistAuth = (token: string, staff: KitchenStaff) => {
    localStorage.setItem(KITCHEN_TOKEN_KEY, token)
    setKitchenStaff(staff)
  }

  const clearAuth = () => {
    localStorage.removeItem(KITCHEN_TOKEN_KEY)
    setKitchenStaff(null)
  }

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem(KITCHEN_TOKEN_KEY)

    if (!token) {
      setLoading(false)
      return
    }

    try {
      const me = await getKitchenMe()
      setKitchenStaff(me)
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
    const data = await loginRequest(email, password)
    persistAuth(data.token, data.kitchen_staff)
  }

  const logout = async () => {
    try {
      await logoutRequest()
    } catch {
      // Token may already be invalid; still clear local session.
    } finally {
      clearAuth()
    }
  }

  const value = useMemo(
    () => ({
      kitchenStaff,
      isAuthenticated: !!kitchenStaff,
      loading,
      login,
      logout,
    }),
    [kitchenStaff, loading],
  )

  return <KitchenAuthContext.Provider value={value}>{children}</KitchenAuthContext.Provider>
}

export function useKitchenAuth() {
  const context = useContext(KitchenAuthContext)

  if (!context) {
    throw new Error('useKitchenAuth must be used within KitchenAuthProvider')
  }

  return context
}
