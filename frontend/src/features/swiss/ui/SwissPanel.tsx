import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { Team } from '@/entities/team/model/types'
import { ScheduleMatchCard } from '@/features/tournament-schedule/ui/ScheduleMatchCard'
import { StandingsTable } from '@/features/tournament-standings/ui/StandingsTable'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { matchService } from '@/shared/api/services/matchService'
import { scheduleService } from '@/shared/api/services/scheduleService'

type SwissPanelProps = {
  tournamentId: string
  isAdmin: boolean
  teams: Team[]
  swissRounds?: number
}

function groupByRound<T extends { round: number; position: number }>(items: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>()
  for (const m of items) {
    const list = map.get(m.round) ?? []
    list.push(m)
    map.set(m.round, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.position - b.position)
  }
  return map
}

export function SwissPanel({ tournamentId, isAdmin, teams, swissRounds }: SwissPanelProps) {
  const [error, setError] = useState<string | null>(null)
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const progressQuery = useQuery({
    queryKey: ['swiss-progress', tournamentId],
    queryFn: () => scheduleService.getSwissProgress(tournamentId),
  })

  const matchesQuery = useQuery({
    queryKey: ['bracket-matches', tournamentId],
    queryFn: () => matchService.listByTournament(tournamentId),
  })

  const standingsQuery = useQuery({
    queryKey: ['standings', tournamentId],
    queryFn: () => scheduleService.getStandings(tournamentId),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
    void queryClient.invalidateQueries({ queryKey: ['standings', tournamentId] })
    void queryClient.invalidateQueries({ queryKey: ['swiss-progress', tournamentId] })
    void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
  }

  const round1Mutation = useMutation({
    mutationFn: () => scheduleService.generateSwissRound1(tournamentId),
    onSuccess: invalidate,
  })

  const nextRoundMutation = useMutation({
    mutationFn: () => scheduleService.generateSwissNextRound(tournamentId),
    onSuccess: invalidate,
  })

  const progress = progressQuery.data
  const maxRounds =
    progress?.maxRounds ??
    (swissRounds ?? Math.max(3, Math.ceil(Math.log2(Math.max(2, teams.length)))))
  const currentRound = progress?.currentRound ?? 0
  const canStart = teams.length >= 4
  const canNext =
    progress?.allCurrentRoundComplete &&
    currentRound > 0 &&
    currentRound < maxRounds

  const roundsMap = useMemo(() => groupByRound(matchesQuery.data ?? []), [matchesQuery.data])
  const roundNumbers = useMemo(() => [...roundsMap.keys()].sort((a, b) => a - b), [roundsMap])

  async function handleSubmitScore(matchId: string, scoreA: number, scoreB: number) {
    setBusyMatchId(matchId)
    setError(null)
    try {
      await matchService.updateResult(tournamentId, matchId, { mode: 'set', scoreA, scoreB })
      invalidate()
    } catch (e) {
      setError(getRestErrorMessage(e))
    } finally {
      setBusyMatchId(null)
    }
  }

  async function handleClear(matchId: string) {
    setBusyMatchId(matchId)
    setError(null)
    try {
      await matchService.updateResult(tournamentId, matchId, { mode: 'clear' })
      invalidate()
    } catch (e) {
      setError(getRestErrorMessage(e))
    } finally {
      setBusyMatchId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {currentRound === 0
            ? `Туров запланировано: ${maxRounds} (авто или из настроек турнира)`
            : `Тур ${currentRound} из ${maxRounds}`}
        </p>
        {isAdmin && canStart ? (
          <>
            {currentRound === 0 ? (
              <Button
                type="button"
                size="sm"
                className="gap-2"
                disabled={round1Mutation.isPending}
                onClick={async () => {
                  setError(null)
                  try {
                    await round1Mutation.mutateAsync()
                  } catch (e) {
                    setError(getRestErrorMessage(e))
                  }
                }}
              >
                {round1Mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shuffle className="h-4 w-4" />
                )}
                Сформировать первый тур
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-2"
                disabled={!canNext || nextRoundMutation.isPending}
                onClick={async () => {
                  setError(null)
                  try {
                    await nextRoundMutation.mutateAsync()
                  } catch (e) {
                    setError(getRestErrorMessage(e))
                  }
                }}
              >
                {nextRoundMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Следующий тур
              </Button>
            )}
          </>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div>
        <h2 className="text-xl font-bold tracking-tight">Турнирная таблица</h2>
        <div className="mt-4">
          <StandingsTable rows={standingsQuery.data ?? []} loading={standingsQuery.isPending} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight">Пары по турам</h2>
        {matchesQuery.isPending ? (
          <p className="mt-4 text-sm text-muted-foreground">Загрузка…</p>
        ) : roundNumbers.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Туры ещё не сформированы.</p>
        ) : (
          <div className="mt-6 space-y-8">
            {roundNumbers.map((round) => (
              <section key={round}>
                <h3 className="mb-3 font-mono text-sm font-bold uppercase tracking-wider text-primary">
                  Тур {round}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(roundsMap.get(round) ?? []).map((m) => (
                    <ScheduleMatchCard
                      key={m.id}
                      match={m}
                      allowDraw
                      isAdmin={isAdmin}
                      isBusy={busyMatchId === m.id}
                      onSubmitScore={handleSubmitScore}
                      onClear={handleClear}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
