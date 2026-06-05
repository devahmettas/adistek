import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getWaiterMe, waiterLogin as loginRequest, waiterLogout as logoutRequest } from '../api/waiterAuth'
import { WAITER_TOKEN_KEY } from '../api/waiterClient'
import type { Waiter } from '../api/types'

interface WaiterAuthContextValue {
  waiter: Waiter | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const WaiterAuthContext = createContext<WaiterAuthContextValue | null>(null)

export function WaiterAuthProvider({ children }: { children: ReactNode }) {
  const [waiter, setWaiter] = useState<Waiter | null>(null)
  const [loading, setLoading] = useState(true)

  const persistAuth = (token: string, authWaiter: Waiter) => {
    localStorage.setItem(WAITER_TOKEN_KEY, token)
    setWaiter(authWaiter)
  }

  const clearAuth = () => {
    localStorage.removeItem(WAITER_TOKEN_KEY)
    setWaiter(null)
  }

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem(WAITER_TOKEN_KEY)

    if (!token) {
      setLoading(false)
      return
    }

    try {
      const me = await getWaiterMe()
      setWaiter(me)
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
    persistAuth(data.token, data.waiter)
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
      waiter,
      isAuthenticated: !!waiter,
      loading,
      login,
      logout,
    }),
    [waiter, loading],
  )

  return <WaiterAuthContext.Provider value={value}>{children}</WaiterAuthContext.Provider>
}

export function useWaiterAuth() {
  const context = useContext(WaiterAuthContext)

  if (!context) {
    throw new Error('useWaiterAuth must be used within WaiterAuthProvider')
  }

  return context
}
