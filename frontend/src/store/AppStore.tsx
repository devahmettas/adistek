import { createContext, ReactNode, useContext, useState } from 'react'

interface AppStore {
  lastCreatedCategoryId: number | null
  setLastCreatedCategoryId: (id: number | null) => void
}

const StoreContext = createContext<AppStore | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lastCreatedCategoryId, setLastCreatedCategoryId] = useState<number | null>(null)

  return (
    <StoreContext.Provider value={{ lastCreatedCategoryId, setLastCreatedCategoryId }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)

  if (!context) {
    throw new Error('useStore must be used within StoreProvider')
  }

  return context
}
