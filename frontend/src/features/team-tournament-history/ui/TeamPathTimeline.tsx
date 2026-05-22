import { motion } from 'framer-motion'
import { Check, CircleDot, CircleSlash, Loader2, Minus } from 'lucide-react'

import { bracketRoundTitle } from '@/features/tournament-bracket/model/roundLabel'
import type { TeamHistoryOutcome } from '@/shared/api/services/teamTournamentHistoryService'
import { cn } from '@/shared/lib/utils'

function outcomeIcon(outcome: TeamHistoryOutcome) {
  switch (outcome) {
    case 'win':
      return <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
    case 'loss':
      return <CircleSlash className="h-3.5 w-3.5 text-destructive" aria-hidden />
    case 'pending':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
    case 'awaiting_opponent':
      return <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
    default:
      return <CircleDot className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
  }
}

type TeamPathTimelineProps = {
  steps: { round: number; outcome: TeamHistoryOutcome }[]
  bracketTotalRounds: number
  selectedIndex: number
  onSelectIndex: (index: number) => void
}

export function TeamPathTimeline({
  steps,
  bracketTotalRounds,
  selectedIndex,
  onSelectIndex,
}: TeamPathTimelineProps) {
  if (steps.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
        Нет матчей в сетке для этой команды.
      </p>
    )
  }

  return (
    <div className="relative">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Путь по раундам</p>
      <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        <div className="flex min-w-min items-center gap-0 px-0.5">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1
            const title = bracketRoundTitle(step.round, bracketTotalRounds)
            const active = idx === selectedIndex

            return (
              <div key={`${step.round}-${idx}`} className="flex items-center">
                <motion.button
                  type="button"
                  layout
                  onClick={() => onSelectIndex(idx)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-left shadow-sm transition-colors',
                    active
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border bg-card hover:border-muted-foreground/40',
                  )}
                >
                  <span className="max-w-[6.5rem] truncate text-[11px] font-semibold leading-tight">{title}</span>
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border',
                      step.outcome === 'win' && 'border-emerald-500/40 bg-emerald-500/10',
                      step.outcome === 'loss' && 'border-destructive/40 bg-destructive/10',
                      step.outcome === 'pending' && 'border-amber-600/30 bg-amber-500/[0.08]',
                      step.outcome === 'awaiting_opponent' && 'border-muted-foreground/25 bg-muted/50',
                    )}
                  >
                    {outcomeIcon(step.outcome)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">#{idx + 1}</span>
                </motion.button>
                {!isLast ? (
                  <div className="mx-1 h-px w-6 shrink-0 bg-border sm:w-10" aria-hidden />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
