import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { SupportFab } from '../ui/SupportFab'
import { SupportModal } from '../ui/SupportModal'

type SupportContextValue = {
  openSupport: () => void
}

const SupportContext = createContext<SupportContextValue | null>(null)

export function useSupport() {
  const ctx = useContext(SupportContext)
  if (!ctx) {
    throw new Error('useSupport must be used within SupportProvider')
  }
  return ctx
}

type SupportProviderProps = {
  children: ReactNode
}

export function SupportProvider({ children }: SupportProviderProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const hideFab = location.pathname.startsWith('/admin')

  const openSupport = useCallback(() => setOpen(true), [])

  const value = useMemo(() => ({ openSupport }), [openSupport])

  return (
    <SupportContext.Provider value={value}>
      {children}
      <SupportModal open={open} onOpenChange={setOpen} />
      {hideFab ? null : <SupportFab onOpen={openSupport} />}
    </SupportContext.Provider>
  )
}
