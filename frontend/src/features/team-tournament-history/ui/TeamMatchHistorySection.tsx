import { motion } from 'framer-motion'

import { bracketRoundTitle } from '@/features/tournament-bracket/model/roundLabel'
import type {
  TeamHistoryOutcome,
  TeamTournamentHistoryStepDto,
} from '@/shared/api/services/teamTournamentHistoryService'
import { cn } from '@/shared/lib/utils'

function outcomeLabel(outcome: TeamHistoryOutcome): string {
  switch (outcome) {
    case 'win':
      return 'Победа'
    case 'loss':
      return 'Поражение'
    case 'pending':
      return 'Идёт / не сыграно'
    case 'awaiting_opponent':
      return 'Ожидание соперника'
    default:
      return '—'
  }
}

function outcomeStyles(outcome: TeamHistoryOutcome): string {
  switch (outcome) {
    case 'win':
      return 'bg-emerald-600/10 text-emerald-900'
    case 'loss':
      return 'bg-destructive/12 text-destructive'
    case 'pending':
      return 'bg-amber-500/10 text-amber-900'
    case 'awaiting_opponent':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

type TeamMatchHistorySectionProps = {
  steps: TeamTournamentHistoryStepDto[]
  bracketTotalRounds: number
  teamName: string
  selectedIndex: number
  onSelectIndex: (index: number) => void
}

export function TeamMatchHistorySection({
  steps,
  bracketTotalRounds,
  teamName,
  selectedIndex,
  onSelectIndex,
}: TeamMatchHistorySectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">История матчей</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Соперники и счёт по мере прохождения сетки. Нажмите карточку или узел пути выше.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {steps.map((step, idx) => {
          const roundTitle = bracketRoundTitle(step.round, bracketTotalRounds)
          const selected = idx === selectedIndex
          const scoreLine =
            step.scoreOur != null && step.scoreTheir != null
              ? `${step.scoreOur} : ${step.scoreTheir}`
              : '— : —'

          return (
            <motion.li
              key={step.matchId}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, type: 'spring', stiffness: 420, damping: 28 }}
            >
              <button
                type="button"
                onClick={() => onSelectIndex(idx)}
                className={cn(
                  'w-full rounded-xl border p-3.5 text-left shadow-sm transition-[border-color,box-shadow,background-color]',
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/25'
                    : 'border-border bg-card hover:border-muted-foreground/35',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{roundTitle}</p>
                    <p className="truncate text-sm font-semibold">
                      <span className="text-foreground">{teamName}</span>
                      <span className="mx-1.5 font-normal text-muted-foreground">vs</span>
                      <span className="text-foreground">{step.opponent?.name ?? '—'}</span>
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">Счёт: {scoreLine}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                      outcomeStyles(step.outcome),
                    )}
                  >
                    {outcomeLabel(step.outcome)}
                  </span>
                </div>
              </button>
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}
