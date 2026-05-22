import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { Team } from '@/entities/team/model/types'
import { ScheduleMatchCard } from '@/features/tournament-schedule/ui/ScheduleMatchCard'
import { StandingsTable } from '@/features/tournament-standings/ui/StandingsTable'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { matchService } from '@/shared/api/services/matchService'
import {
  ROUND_ROBIN_MAX_TEAMS,
  ROUND_ROBIN_MIN_TEAMS,
  scheduleService,
} from '@/shared/api/services/scheduleService'

type RoundRobinPanelProps = {
  tournamentId: string
  isAdmin: boolean
  teams: Team[]
}

function groupByRound<T extends { round: number }>(items: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>()
  for (const m of items) {
    const list = map.get(m.round) ?? []
    list.push(m)
    map.set(m.round, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => ('position' in a && 'position' in b ? (a as { position: number }).position - (b as { position: number }).position : 0))
  }
  return map
}

export function RoundRobinPanel({ tournamentId, isAdmin, teams }: RoundRobinPanelProps) {
  const [error, setError] = useState<string | null>(null)
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const matchesQuery = useQuery({
    queryKey: ['bracket-matches', tournamentId],
    queryFn: () => matchService.listByTournament(tournamentId),
  })

  const standingsQuery = useQuery({
    queryKey: ['standings', tournamentId],
    queryFn: () => scheduleService.getStandings(tournamentId),
  })

  const generateMutation = useMutation({
    mutationFn: (teamIds: string[]) => scheduleService.generateRoundRobin(tournamentId, teamIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['standings', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    },
  })

  const seedIds = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name, 'ru')).map((t) => t.id),
    [teams],
  )
  const canGenerate =
    teams.length >= ROUND_ROBIN_MIN_TEAMS && teams.length <= ROUND_ROBIN_MAX_TEAMS

  const roundsMap = useMemo(() => groupByRound(matchesQuery.data ?? []), [matchesQuery.data])
  const roundNumbers = useMemo(() => [...roundsMap.keys()].sort((a, b) => a - b), [roundsMap])

  async function handleGenerate() {
    if (!canGenerate) return
    const n = teams.length
    const matches = (n * (n - 1)) / 2
    if (!window.confirm(`Создать календарь на ${n} команд (${matches} матчей)?`)) return
    setError(null)
    try {
      await generateMutation.mutateAsync(seedIds)
    } catch (e) {
      setError(getRestErrorMessage(e))
    }
  }

  async function handleSubmitScore(matchId: string, scoreA: number, scoreB: number) {
    setBusyMatchId(matchId)
    setError(null)
    try {
      await matchService.updateResult(tournamentId, matchId, { mode: 'set', scoreA, scoreB })
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['standings', tournamentId] })
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
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['standings', tournamentId] })
    } catch (e) {
      setError(getRestErrorMessage(e))
    } finally {
      setBusyMatchId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Турнирная таблица</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Очки: 3 за победу, 1 за ничью, 0 за поражение. До {ROUND_ROBIN_MAX_TEAMS} команд.
        </p>
        <div className="mt-4">
          <StandingsTable rows={standingsQuery.data ?? []} loading={standingsQuery.isPending} />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight">Календарь матчей</h2>
          {isAdmin ? (
            <Button
              type="button"
              size="sm"
              className="gap-2"
              disabled={!canGenerate || generateMutation.isPending}
              onClick={() => void handleGenerate()}
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="h-4 w-4" />
              )}
              {matchesQuery.data?.length ? 'Пересоздать календарь' : 'Сгенерировать календарь'}
            </Button>
          ) : null}
        </div>
        {!canGenerate && isAdmin ? (
          <p className="mt-2 text-sm text-amber-800">
            Нужно от {ROUND_ROBIN_MIN_TEAMS} до {ROUND_ROBIN_MAX_TEAMS} команд (сейчас {teams.length}).
          </p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

        {matchesQuery.isPending ? (
          <p className="mt-4 text-sm text-muted-foreground">Загрузка матчей…</p>
        ) : roundNumbers.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Календарь ещё не сформирован.</p>
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
