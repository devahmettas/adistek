import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getSession,
  login as loginRequest,
  loginJewelerStaff,
  logout as logoutRequest,
  register as registerRequest,
} from '../api/auth'
import { TOKEN_KEY, AUTH_ROLE_KEY } from '../api/client'
import type { JewelerStaffUser, Restaurant } from '../api/types'
import type { JewelerPermissionMap } from '../constants/jewelerPermissions'
import { JEWELER_OWNER_PERMISSIONS } from '../constants/jewelerPermissions'

interface AuthContextValue {
  restaurant: Restaurant | null
  staff: JewelerStaffUser | null
  isOwner: boolean
  permissions: JewelerPermissionMap
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string, asStaff?: boolean) => Promise<void>
  register: (payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) => Promise<void>
  logout: () => Promise<void>
  updateRestaurant: (restaurant: Restaurant) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [staff, setStaff] = useState<JewelerStaffUser | null>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [permissions, setPermissions] = useState<JewelerPermissionMap>(JEWELER_OWNER_PERMISSIONS)
  const [loading, setLoading] = useState(true)

  const persistAuth = (
    token: string,
    authRestaurant: Restaurant,
    authStaff: JewelerStaffUser | null,
    authPermissions: JewelerPermissionMap,
    owner: boolean,
  ) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(AUTH_ROLE_KEY, owner ? 'owner' : 'staff')
    setRestaurant(authRestaurant)
    setStaff(authStaff)
    setPermissions(authPermissions)
    setIsOwner(owner)
  }

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(AUTH_ROLE_KEY)
    setRestaurant(null)
    setStaff(null)
    setPermissions(JEWELER_OWNER_PERMISSIONS)
    setIsOwner(true)
  }

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      setLoading(false)
      return
    }

    try {
      const session = await getSession()
      setRestaurant(session.restaurant)
      setStaff(session.staff)
      setPermissions(session.permissions)
      setIsOwner(session.isOwner)
    } catch {
      clearAuth()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = async (email: string, password: string, asStaff = false) => {
    if (asStaff) {
      const data = await loginJewelerStaff(email, password)
      persistAuth(data.token, data.restaurant, data.staff, data.permissions, false)
      return
    }

    const data = await loginRequest(email, password)
    persistAuth(data.token, data.restaurant, null, JEWELER_OWNER_PERMISSIONS, true)
  }

  const register = async (payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) => {
    const data = await registerRequest(payload)
    persistAuth(data.token, data.restaurant, null, JEWELER_OWNER_PERMISSIONS, true)
  }

  const logout = async () => {
    try {
      await logoutRequest(isOwner)
    } catch {
      // Token may already be invalid; still clear local session.
    } finally {
      clearAuth()
    }
  }

  const updateRestaurant = (authRestaurant: Restaurant) => {
    setRestaurant(authRestaurant)
  }

  const value = useMemo(
    () => ({
      restaurant,
      staff,
      isOwner,
      permissions,
      isAuthenticated: !!restaurant,
      loading,
      login,
      register,
      logout,
      updateRestaurant,
    }),
    [restaurant, staff, isOwner, permissions, loading],
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
