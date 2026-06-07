import { createContext, ReactNode, useContext } from 'react'
import useDashboard from '../hooks/useDashboard'

type DashboardContextValue = ReturnType<typeof useDashboard>

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const value = useDashboard()

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboardData() {
  const context = useContext(DashboardContext)

  if (!context) {
    throw new Error('useDashboardData must be used within DashboardProvider')
  }

  return context
}
