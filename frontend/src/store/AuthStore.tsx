import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getMe, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/auth'
import { TOKEN_KEY } from '../api/client'
import type { Restaurant } from '../api/types'

interface AuthContextValue {
  restaurant: Restaurant | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)

  const persistAuth = (token: string, authRestaurant: Restaurant) => {
    localStorage.setItem(TOKEN_KEY, token)
    setRestaurant(authRestaurant)
  }

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY)
    setRestaurant(null)
  }

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      setLoading(false)
      return
    }

    try {
      const me = await getMe()
      setRestaurant(me)
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
    persistAuth(data.token, data.restaurant)
  }

  const register = async (payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) => {
    const data = await registerRequest(payload)
    persistAuth(data.token, data.restaurant)
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
      restaurant,
      isAuthenticated: !!restaurant,
      loading,
      login,
      register,
      logout,
    }),
    [restaurant, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
