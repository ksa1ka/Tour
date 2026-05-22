import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { AdminSidebar } from './AdminSidebar'

type AdminMobileDrawerProps = {
  open: boolean
  onClose: () => void
}

export function AdminMobileDrawer({ open, onClose }: AdminMobileDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-black/70 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="Закрыть меню админки"
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-[min(17rem,90vw)] md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="flex h-full flex-col border-r border-border/90 bg-card/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-border px-3 py-3">
                <span className="text-sm font-semibold tracking-tight">Админ-меню</span>
                <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminSidebar variant="drawer" className="w-full" onNavigate={onClose} />
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
