import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { GitBranchPlus, Loader2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { DndProvider } from 'react-dnd-multi-backend'

import { Button } from '@/components/ui/button'
import type { Team } from '@/entities/team/model/types'
import { TeamHistoryModal, type TeamHistoryModalTeam } from '@/features/team-tournament-history/ui/TeamHistoryModal'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import {
  BRACKET_TEAM_COUNTS,
  isBracketTeamCount,
  matchService,
  type BracketMatchDto,
  type BracketTeamDto,
  type SwapBracketTeamSlotsPayload,
} from '@/shared/api/services/matchService'

import {
  useClearMatchResultMutation,
  useGenerateBracketMutation,
  useSetBracketMatchWinnerMutation,
  useSwapBracketTeamSlotsMutation,
} from '../api/useBracketMutations'
import { bracketDndMultiBackendOptions } from '../dnd/bracketMultiBackend'
import { BracketTeamDragLayer } from './BracketTeamDragLayer'
import { BracketRoundColumn } from './BracketRoundColumn'

type TournamentBracketProps = {
  tournamentId: string
  format: string
  isAdmin: boolean
  teams: Team[]
}

function groupByRound(matches: BracketMatchDto[]): Map<number, BracketMatchDto[]> {
  const map = new Map<number, BracketMatchDto[]>()
  for (const m of matches) {
    const list = map.get(m.round) ?? []
    list.push(m)
    map.set(m.round, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.position - b.position)
  }
  return map
}

export function TournamentBracket({ tournamentId, format, isAdmin, teams }: TournamentBracketProps) {
  const [error, setError] = useState<string | null>(null)
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null)
  const [historyTeam, setHistoryTeam] = useState<TeamHistoryModalTeam | null>(null)

  const enabled = format === 'SINGLE_ELIMINATION'

  const matchesQuery = useQuery({
    queryKey: ['bracket-matches', tournamentId],
    queryFn: () => matchService.listByTournament(tournamentId),
    enabled,
    /** Сокет помечает запрос устаревшим сразу; короткий staleTime не даёт «залипнуть» на старых матчах между событиями. */
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  })

  const generateMutation = useGenerateBracketMutation(tournamentId)
  const setWinnerMutation = useSetBracketMatchWinnerMutation(tournamentId)
  const clearMutation = useClearMatchResultMutation(tournamentId)
  const swapSlotsMutation = useSwapBracketTeamSlotsMutation(tournamentId)

  const seedIds = useMemo(() => [...teams].sort((a, b) => a.name.localeCompare(b.name, 'ru')).map((t) => t.id), [teams])
  const canGenerate = isBracketTeamCount(teams.length)

  const roundsMap = useMemo(() => {
    const list = matchesQuery.data ?? []
    return groupByRound(list)
  }, [matchesQuery.data])

  const totalRounds = useMemo(() => {
    const list = matchesQuery.data ?? []
    if (list.length === 0) return 0
    return Math.max(...list.map((m) => m.round))
  }, [matchesQuery.data])

  const roundNumbers = useMemo(() => [...roundsMap.keys()].sort((a, b) => a - b), [roundsMap])

  const handleSwapTeamSlots = useCallback(
    async (payload: SwapBracketTeamSlotsPayload) => {
      setError(null)
      try {
        await swapSlotsMutation.mutateAsync(payload)
      } catch (e) {
        setError(getRestErrorMessage(e))
      }
    },
    [swapSlotsMutation],
  )

  if (!enabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Интерактивная сетка доступна для турниров в формате «Олимпийская система» (SINGLE_ELIMINATION).
      </p>
    )
  }

  async function handleGenerate() {
    if (!canGenerate) return
    if (!window.confirm(`Создать или пересоздать сетку на ${teams.length} команд (посев по алфавиту названий)?`)) return
    setError(null)
    try {
      await generateMutation.mutateAsync(seedIds)
    } catch (e) {
      setError(getRestErrorMessage(e))
    }
  }

  async function handleSubmitScore(matchId: string, scoreA: number, scoreB: number) {
    const m = (matchesQuery.data ?? []).find((x) => x.id === matchId)
    if (!m?.teamAId || !m?.teamBId) return
    if (scoreA === scoreB) {
      setError('Ничья недопустима — укажите разный счёт для обеих команд.')
      return
    }
    const winnerId = scoreA > scoreB ? m.teamAId : m.teamBId
    setBusyMatchId(matchId)
    setError(null)
    try {
      await setWinnerMutation.mutateAsync({
        matchId,
        payload: { winnerId, scoreA, scoreB },
      })
    } catch (e) {
      setError(getRestErrorMessage(e))
    } finally {
      setBusyMatchId(null)
    }
  }

  async function handleClear(matchId: string) {
    if (!window.confirm('Сбросить результат матча и связанные продвижения по сетке?')) return
    setBusyMatchId(matchId)
    setError(null)
    try {
      await clearMutation.mutateAsync(matchId)
    } catch (e) {
      setError(getRestErrorMessage(e))
    } finally {
      setBusyMatchId(null)
    }
  }

  const hasBracket = (matchesQuery.data?.length ?? 0) > 0

  function handleTeamClick(team: BracketTeamDto) {
    setHistoryTeam({ id: team.id, name: team.name })
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground drop-shadow-[0_0_24px_hsl(var(--primary)/0.15)] sm:text-2xl">
            Турнирная сетка
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Колонки — раунды турнира. Сетка не статична: при смене счёта, победителя, посева или состава команд данные
            подтягиваются по WebSocket без перезагрузки страницы. Анимации показывают, что именно изменилось. Нужно ровно{' '}
            {BRACKET_TEAM_COUNTS.join(', ')} команд. Нажмите на название команды в матче, чтобы открыть её путь по
            турниру.
          </p>
        </div>
        {isAdmin ? (
          <Button
            type="button"
            className="w-full shrink-0 gap-2 sm:w-auto"
            disabled={!canGenerate || generateMutation.isPending}
            onClick={() => void handleGenerate()}
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <GitBranchPlus className="h-4 w-4" aria-hidden />
            )}
            {hasBracket ? 'Пересоздать сетку' : 'Сгенерировать сетку'}
          </Button>
        ) : null}
      </div>

      {!canGenerate && isAdmin ? (
        <p className="rounded-xl border border-amber-600/22 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-950 shadow-inner-glow backdrop-blur-sm">
          Сейчас в турнире {teams.length} команд. Сетка строится только при {BRACKET_TEAM_COUNTS.join(', ')} участниках
          (посев — по алфавиту).
        </p>
      ) : null}

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      {matchesQuery.isPending ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-xl border border-border/90 bg-card/50 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm"
        >
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden />
          <span className="font-medium">Загрузка сетки…</span>
        </motion.div>
      ) : matchesQuery.isError ? (
        <p className="text-sm font-medium text-destructive">Не удалось загрузить матчи сетки.</p>
      ) : !hasBracket ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-primary/30 bg-muted/20 px-5 py-10 text-center text-sm font-medium text-muted-foreground shadow-inner-glow backdrop-blur-sm"
        >
          Сетка ещё не создана.
          {isAdmin && canGenerate ? ' Нажмите «Сгенерировать сетку», чтобы построить пары.' : null}
        </motion.p>
      ) : (
        <>
          <p className="text-xs font-medium text-muted-foreground md:hidden">
            Листайте сетку горизонтально — колонки прилипают к краю при прокрутке.
          </p>
          {isAdmin ? (
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              Посев 1-го раунда: перетащите команду за иконку «⋮⋮» на другой слот. Превью следует за курсором; зона
              приёма подсвечивается. На телефоне удерживайте слот чуть дольше, затем ведите палец.
            </p>
          ) : null}
          <AnimatePresence mode="popLayout">
            <DndProvider options={bracketDndMultiBackendOptions}>
              <motion.div
                key="bracket-scroll"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="relative -mx-4 overflow-x-auto overflow-y-visible scroll-smooth rounded-2xl border border-border/90 bg-card/55 pb-4 shadow-glass backdrop-blur-xl [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:hsl(var(--primary)/0.35)_hsl(var(--muted)/0.4)] touch-pan-x overscroll-x-contain [-webkit-overflow-scrolling:touch] sm:-mx-6 md:mx-0"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-primary/35 opacity-90"
                  aria-hidden
                />
                <BracketTeamDragLayer />
                <LayoutGroup id={`tournament-bracket-${tournamentId}`}>
                  <div className="relative z-[2] flex min-h-[min(28rem,70svh)] snap-x snap-mandatory gap-0 px-2 py-4 sm:min-h-[20rem] sm:px-3 md:snap-none md:gap-0 md:px-2 lg:min-h-[22rem]">
                    {roundNumbers.map((round, colIdx) => (
                      <BracketRoundColumn
                        key={round}
                        tournamentId={tournamentId}
                        round={round}
                        roundIndex={colIdx + 1}
                        totalRounds={totalRounds}
                        isFirstColumn={colIdx === 0}
                        matches={roundsMap.get(round) ?? []}
                        isAdmin={isAdmin}
                        busyMatchId={busyMatchId}
                        swapBusy={swapSlotsMutation.isPending}
                        onSubmitScore={handleSubmitScore}
                        onClear={handleClear}
                        onTeamClick={hasBracket ? handleTeamClick : undefined}
                        onSwapTeamSlots={handleSwapTeamSlots}
                      />
                    ))}
                  </div>
                </LayoutGroup>
              </motion.div>
            </DndProvider>
          </AnimatePresence>
        </>
      )}

      <TeamHistoryModal
        tournamentId={tournamentId}
        team={historyTeam}
        open={historyTeam !== null}
        onOpenChange={(next) => {
          if (!next) setHistoryTeam(null)
        }}
      />
    </div>
  )
}
