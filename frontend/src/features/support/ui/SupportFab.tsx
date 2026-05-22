import { Headphones } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'

type SupportFabProps = {
  onOpen: () => void
}

export function SupportFab({ onOpen }: SupportFabProps) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[60] flex flex-col items-end gap-2',
      )}
    >
      <Button
        type="button"
        size="lg"
        className="pointer-events-auto h-14 min-h-14 rounded-full px-5 shadow-lg shadow-primary/25 ring-2 ring-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:h-14"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label="Открыть поддержку"
      >
        <Headphones className="h-5 w-5" aria-hidden />
        <span className="hidden sm:inline">Поддержка</span>
      </Button>
    </div>
  )
}
