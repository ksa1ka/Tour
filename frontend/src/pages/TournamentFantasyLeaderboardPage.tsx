import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { fetchTournament } from '@/entities/tournament/api/tournamentApi'
import { fantasyService } from '@/shared/api/services/fantasyService'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { useTournamentSocketSync } from '@/shared/hooks/useTournamentSocketSync'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageLoader } from '@/shared/ui/PageLoader'

export function TournamentFantasyLeaderboardPage() {
  const { id: tournamentId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = user?.role === 'ADMIN'

  useTournamentSocketSync(tournamentId ?? null)

  const tournamentQuery = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => fetchTournament(tournamentId as string),
    enabled: Boolean(tournamentId),
  })

  const boardQuery = useQuery({
    queryKey: ['fantasy-leaderboard', tournamentId],
    queryFn: () => fantasyService.getTournamentLeaderboard(tournamentId as string, { limit: 50 }),
    enabled: Boolean(tournamentId),
    refetchInterval: 12_000,
  })

  const recalcMutation = useMutation({
    mutationFn: () => fantasyService.recalculateTournamentFantasy(tournamentId as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['fantasy-leaderboard', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-me', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-board', tournamentId] })
    },
  })

  if (!tournamentId) return <Navigate to="/tournaments" replace />

  if (tournamentQuery.isPending) return <PageLoader message="Загрузка…" />

  if (tournamentQuery.isError || !tournamentQuery.data) {
    return (
      <PageContainer title="Таблица лидеров" tagline="Ошибка">
        <p className="text-sm text-destructive">Не удалось загрузить турнир.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/tournaments">К турнирам</Link>
        </Button>
      </PageContainer>
    )
  }

  const t = tournamentQuery.data
  const rows = boardQuery.data?.leaderboard ?? []
  const total = boardQuery.data?.total ?? 0

  return (
    <PageContainer
      variant="wide"
      title={`Таблица лидеров · ${t.title}`}
      description={`Участников: ${total}. Позиции обновляются по мере прохождения матчей.`}
      tagline="Фэнтези-лига"
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          {isAdmin ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              disabled={recalcMutation.isPending}
              onClick={() => recalcMutation.mutate()}
            >
              <RefreshCw className={`h-4 w-4 ${recalcMutation.isPending ? 'animate-spin' : ''}`} />
              Пересчитать очки
            </Button>
          ) : null}
          <Button asChild variant="outline" className="w-full gap-2 sm:w-auto">
            <Link to={`/tournaments/${tournamentId}/fantasy?focus=roster`}>Моя команда</Link>
          </Button>
        </div>
      }
    >
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link to={`/tournaments/${tournamentId}/fantasy?focus=roster`}>
            <ArrowLeft className="h-4 w-4" />
            К фэнтези турнира
          </Link>
        </Button>
      </div>

      {recalcMutation.isError ? (
        <p className="mb-4 text-sm text-destructive">{getRestErrorMessage(recalcMutation.error)}</p>
      ) : null}

      <Card className="glass-panel">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Рейтинг</CardTitle>
          </div>
          <CardDescription>Места меняются автоматически, когда обновляются результаты матчей.</CardDescription>
        </CardHeader>
        <CardContent>
          {boardQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Загрузка таблицы…</p>
          ) : boardQuery.isError ? (
            <p className="text-sm text-destructive">Не удалось загрузить лидерборд.</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока никто не собрал состав для этого турнира.</p>
          ) : (
            <LayoutGroup id={`fantasy-board-${tournamentId}`}>
              <ol className="space-y-2">
                <AnimatePresence initial={false}>
                  {rows.map((entry) => (
                    <motion.li
                      key={entry.id}
                      layout
                      layoutId={entry.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-md border border-border bg-card text-base font-bold tabular-nums text-foreground sm:h-10 sm:w-10 sm:text-lg">
                        {entry.rank}
                      </span>
                      <div className="min-w-0 w-full flex-1 sm:w-auto">
                        <p className="truncate font-semibold">
                          <Link
                            to={`/users/${entry.user.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {entry.name?.trim() || entry.user.displayName || entry.user.email}
                          </Link>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{entry.user.email}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {entry.selections.map((s) => (
                            <span
                              key={s.team.id}
                              className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                              {s.team.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <motion.div layout className="flex w-full shrink-0 flex-col items-stretch gap-0.5 sm:w-auto sm:items-end sm:self-center">
                        <motion.span
                          layout
                          className="rounded-md border border-border bg-card px-3 py-2 text-center text-base font-bold tabular-nums text-foreground sm:py-1.5 sm:text-lg"
                        >
                          {entry.points}
                        </motion.span>
                        <span className="text-center text-[10px] text-muted-foreground sm:text-right">
                          состав {entry.rosterPoints} · прогнозы {entry.fantasyPredictionPoints} · бонусы {entry.fantasyBonusPoints}
                        </span>
                      </motion.div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
            </LayoutGroup>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
