import { motion } from 'framer-motion'

import type { BracketMatchDto, BracketTeamDto } from '@/shared/api/services/matchService'

import { bracketRoundTitle } from '../model/roundLabel'
import { BracketMatchCard } from './BracketMatchCard'

type BracketRoundColumnProps = {
  tournamentId: string
  round: number
  /** Порядковый номер колонки (1 … N) для подписи «Этап» */
  roundIndex: number
  totalRounds: number
  /** Левая граница-сетка только между колонками */
  isFirstColumn: boolean
  matches: BracketMatchDto[]
  isAdmin: boolean
  busyMatchId: string | null
  swapBusy: boolean
  onSubmitScore: (matchId: string, scoreA: number, scoreB: number) => void
  onClear: (matchId: string) => void
  onTeamClick?: (team: BracketTeamDto) => void
  onSwapTeamSlots: (payload: {
    fromMatchId: string
    fromSide: 'A' | 'B'
    toMatchId: string
    toSide: 'A' | 'B'
  }) => void
}

export function BracketRoundColumn({
  tournamentId,
  round,
  roundIndex,
  totalRounds,
  isFirstColumn,
  matches,
  isAdmin,
  busyMatchId,
  swapBusy,
  onSubmitScore,
  onClear,
  onTeamClick,
  onSwapTeamSlots,
}: BracketRoundColumnProps) {
  const title = bracketRoundTitle(round, totalRounds)

  return (
    <motion.section
      layout
      className={`flex min-w-[clamp(15.5rem,78vw,18rem)] max-w-[min(18rem,92vw)] shrink-0 snap-start flex-col gap-5 px-3 sm:min-w-[17rem] sm:max-w-none sm:gap-6 sm:px-4 md:min-w-[18.5rem] md:px-5 ${isFirstColumn ? '' : 'border-l border-border/80 md:border-border/90'}`}
    >
      <div className="sticky top-0 z-10 rounded-2xl border border-border/90 bg-card/95 py-3 pl-3.5 pr-3 shadow-card backdrop-blur-xl sm:border-border/90 sm:shadow-inner-glow">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary/85">
            Этап {roundIndex}/{totalRounds}
          </p>
          <span className="rounded-lg border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-primary">
            R{round}
          </span>
        </div>
        <h3 className="mt-2 text-base font-extrabold tracking-tight text-foreground sm:text-lg">{title}</h3>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {matches.length} {matches.length === 1 ? 'матч' : 'матча'}
        </p>
      </div>

      <motion.div layout className="flex flex-col gap-8 md:gap-9">
        {matches.map((m, idx) => (
          <motion.div
            key={m.id}
            layout
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.045, type: 'spring', stiffness: 380, damping: 28 }}
            className="flex justify-center"
          >
            <BracketMatchCard
              tournamentId={tournamentId}
              match={m}
              isAdmin={isAdmin}
              isBusy={busyMatchId === m.id}
              swapBusy={swapBusy}
              onSubmitScore={onSubmitScore}
              onClear={onClear}
              onTeamClick={onTeamClick}
              onSwapTeamSlots={onSwapTeamSlots}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  )
}
