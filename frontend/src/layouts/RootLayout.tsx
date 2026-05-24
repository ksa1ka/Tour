import { useLocation } from 'react-router-dom'

import { useProfileAuthSync } from '@/features/profile/api/useProfileAuthSync'
import { useAccountFantasyQuerySync } from '@/shared/hooks/useAccountFantasyQuerySync'
import { AnimatedOutlet } from '@/shared/ui/AnimatedOutlet'
import { AppNavbar } from '@/widgets/app-shell/ui/AppNavbar'

export function RootLayout() {
  useProfileAuthSync()
  useAccountFantasyQuerySync()
  const location = useLocation()
  const isAdminArea = location.pathname.startsWith('/admin')

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="esports-mesh" aria-hidden />
      <AppNavbar />
      <div className="flex min-h-0 flex-1">
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <AnimatedOutlet />
        </main>
      </div>
      {!isAdminArea ? (
        <footer className="relative border-t border-border/80 bg-card/90 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground shadow-[0_-8px_32px_-16px_hsl(288_52%_48%/0.1)] backdrop-blur-xl sm:py-6">
          <span className="font-display relative z-[1] font-bold uppercase tracking-[0.18em] text-foreground">
            Tour <span className="text-esports-accent">Arena</span>
          </span>
          <span className="relative z-[1] text-muted-foreground/85"> · турниры и соревнования</span>
        </footer>
      ) : null}
    </div>
  )
}
