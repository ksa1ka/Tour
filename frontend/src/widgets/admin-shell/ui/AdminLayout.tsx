import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft, Menu, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { AdminMobileDrawer } from './AdminMobileDrawer'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
      <AdminSidebar />
      <AdminMobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border/90 bg-card/90 px-[max(0.75rem,env(safe-area-inset-left))] py-3 pr-[max(0.75rem,env(safe-area-inset-right))] shadow-nav backdrop-blur-xl md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 border border-border bg-muted/50"
            aria-label="Открыть меню админки"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 shadow-glow-sm">
              <Shield className="h-4 w-4 text-primary" />
            </span>
            <span className="truncate text-sm font-bold tracking-tight">Админ</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="ml-auto shrink-0 text-muted-foreground">
            <Link to="/" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Сайт
            </Link>
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-[max(1rem,env(safe-area-inset-left))] py-6 pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
