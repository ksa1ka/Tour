import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import type { BracketMatchDto, BracketTeamDto } from '@/shared/api/services/matchService'
import {
  type MatchScoreFormValues,
  matchScoreSetFormSchema,
  scoresFromMatchScoreForm,
} from '@/features/tournament-bracket/model/matchScoreFormSchema'

import { BracketTeamSlotRow } from './BracketTeamSlotRow'

type BracketMatchCardProps = {
  tournamentId: string
  match: BracketMatchDto
  isAdmin: boolean
  isBusy: boolean
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

export function BracketMatchCard({
  tournamentId,
  match,
  isAdmin,
  isBusy,
  swapBusy,
  onSubmitScore,
  onClear,
  onTeamClick,
  onSwapTeamSlots,
}: BracketMatchCardProps) {
  const form = useForm<MatchScoreFormValues>({
    resolver: zodResolver(matchScoreSetFormSchema),
    defaultValues: {
      scoreA: match.scoreA != null ? String(match.scoreA) : '',
      scoreB: match.scoreB != null ? String(match.scoreB) : '',
    },
  })

  useEffect(() => {
    form.reset({
      scoreA: match.scoreA != null ? String(match.scoreA) : '',
      scoreB: match.scoreB != null ? String(match.scoreB) : '',
    })
  }, [match.id, match.scoreA, match.scoreB, form])

  const hasBothTeams = Boolean(match.teamAId && match.teamBId)
  const finished = Boolean(match.winnerId)
  const winnerA = match.winnerId && match.teamAId === match.winnerId
  const winnerB = match.winnerId && match.teamBId === match.winnerId

  const canEdit = isAdmin && hasBothTeams && !finished
  const seedingEditable = isAdmin && match.round === 1 && !finished

  return (
    <motion.article
      layout
      layoutId={match.id}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="group relative w-full max-w-[min(18rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-border/90 bg-card/95 p-3 shadow-card ring-1 ring-border/40 backdrop-blur-md sm:max-w-[280px] sm:p-4"
      whileHover={{ y: -2 }}
    >
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-primary/80 transition-opacity ${finished ? 'opacity-100' : 'opacity-0 group-hover:opacity-90'}`}
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.07] blur-2xl transition-opacity duration-500 group-hover:opacity-100 sm:opacity-80"
        aria-hidden
      />
      <div className="relative flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary/90">Матч</span>
          <span className="rounded-lg border border-border/90 bg-muted/60 px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-muted-foreground">
            #{match.position}
          </span>
        </div>

        <div className="relative flex flex-col gap-0 overflow-hidden rounded-xl border border-border/80 bg-muted/50 shadow-inner-glow">
          <BracketTeamSlotRow
            tournamentId={tournamentId}
            matchId={match.id}
            round={match.round}
            side="A"
            team={match.teamA}
            isWinner={Boolean(winnerA)}
            isDimmed={finished && !winnerA}
            seedingEditable={seedingEditable}
            swapDisabled={swapBusy}
            onTeamClick={onTeamClick}
            onSwapSlots={onSwapTeamSlots}
            roundedPosition="top"
          />
          <div
            className="relative flex h-7 shrink-0 items-center justify-center border-y border-border/80 bg-muted/40"
            aria-hidden
          >
            {hasBothTeams ? (
              <span className="rounded-full border border-border/90 bg-muted/60 px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                VS
              </span>
            ) : (
              <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                —
              </span>
            )}
          </div>
          <BracketTeamSlotRow
            tournamentId={tournamentId}
            matchId={match.id}
            round={match.round}
            side="B"
            team={match.teamB}
            isWinner={Boolean(winnerB)}
            isDimmed={finished && !winnerB}
            seedingEditable={seedingEditable}
            swapDisabled={swapBusy}
            onTeamClick={onTeamClick}
            onSwapSlots={onSwapTeamSlots}
            roundedPosition="bottom"
          />
        </div>

        {canEdit ? (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-1 flex flex-col gap-2 border-t border-border/90 pt-2"
            onSubmit={form.handleSubmit((values) => {
              const { scoreA, scoreB } = scoresFromMatchScoreForm(values)
              onSubmitScore(match.id, scoreA, scoreB)
            })}
            noValidate
          >
            <div className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1 font-mono text-[10px] font-semibold text-muted-foreground">
                A
                <input
                  type="number"
                  min={0}
                  max={999}
                  className="h-9 rounded-lg border border-border/90 bg-muted/40 px-2 text-sm font-medium text-foreground outline-none backdrop-blur-sm transition-[border-color,box-shadow] focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/30"
                  {...form.register('scoreA')}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 font-mono text-[10px] font-semibold text-muted-foreground">
                B
                <input
                  type="number"
                  min={0}
                  max={999}
                  className="h-9 rounded-lg border border-border/90 bg-muted/40 px-2 text-sm font-medium text-foreground outline-none backdrop-blur-sm transition-[border-color,box-shadow] focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/30"
                  {...form.register('scoreB')}
                />
              </label>
            </div>
            {(form.formState.errors.scoreA || form.formState.errors.scoreB) && (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.scoreA?.message ?? form.formState.errors.scoreB?.message}
              </p>
            )}
            <Button type="submit" size="sm" className="w-full rounded-lg font-semibold" disabled={isBusy}>
              {isBusy ? 'Сохранение…' : 'Зафиксировать счёт'}
            </Button>
          </motion.form>
        ) : null}

        {finished ? (
          <div className="mt-0.5 flex flex-col gap-2 border-t border-border/80 pt-2.5">
            <motion.div
              layout
              key={`result-${match.winnerId}-${match.scoreA}-${match.scoreB}`}
              initial={{ scale: 0.96, opacity: 0.88 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                layout: { type: 'spring', stiffness: 420, damping: 34 },
                opacity: { duration: 0.22 },
                scale: { type: 'spring', stiffness: 460, damping: 28 },
              }}
              className="flex items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={`sa-${match.scoreA}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  className="inline-block min-w-[1.5ch] text-center font-mono text-lg font-bold tabular-nums text-foreground sm:text-xl"
                >
                  {match.scoreA ?? '—'}
                </motion.span>
              </AnimatePresence>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">:</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={`sb-${match.scoreB}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  className="inline-block min-w-[1.5ch] text-center font-mono text-lg font-bold tabular-nums text-foreground sm:text-xl"
                >
                  {match.scoreB ?? '—'}
                </motion.span>
              </AnimatePresence>
            </motion.div>
            {isAdmin ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 rounded-lg px-2 text-muted-foreground hover:text-destructive"
                  disabled={isBusy}
                  onClick={() => onClear(match.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Сброс
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {!hasBothTeams && !finished ? (
          <p className="mt-1 border-t border-border/80 pt-2 text-center text-[11px] font-medium text-muted-foreground">
            Ожидание соперника
          </p>
        ) : null}
      </div>
    </motion.article>
  )
}
