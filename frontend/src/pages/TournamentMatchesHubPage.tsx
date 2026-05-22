import { useQuery } from '@tanstack/react-query'
import { Inbox, Trophy, WifiOff } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { matchStageLabel } from '@/features/tournament-bracket/model/roundLabel'
import { matchService } from '@/shared/api/services/matchService'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner'
import { PageContainer } from '@/shared/ui/PageContainer'
import { SafeImage } from '@/shared/ui/SafeImage'

function scoreLine(scoreA: number | null, scoreB: number | null) {
  if (scoreA != null && scoreB != null) return `${scoreA} : ${scoreB}`
  return '— : —'
}

export function TournamentMatchesHubPage() {
  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ['matches', 'feed'],
    queryFn: () => matchService.listAllFeed(),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })

  const maxRoundByTournamentId = useMemo(() => {
    const m = new Map<string, number>()
    if (!data) return m
    for (const row of data) {
      const cur = m.get(row.tournamentId) ?? 0
      if (row.round > cur) m.set(row.tournamentId, row.round)
    }
    return m
  }, [data])

  return (
    <PageContainer
      title="Матчи и результаты"
      description="Все матчи по турнирам: пары, счёт и победитель. Список обновляется автоматически."
      tagline="Турниры"
    >
      {isPending ? (
        <div className="flex items-center gap-3 rounded-xl border border-border/90 bg-card/50 px-4 py-3 text-sm text-muted-foreground shadow-inner-glow backdrop-blur-sm">
          <LoadingSpinner size="sm" />
          <span className="font-medium">Загрузка матчей…</span>
        </div>
      ) : null}

      {isError ? (
        <EmptyState
          icon={WifiOff}
          title="Не удалось загрузить матчи"
          description="Проверьте соединение и попробуйте снова."
          action={
            <Button type="button" variant="outline" disabled={isRefetching} onClick={() => void refetch()}>
              {isRefetching ? 'Запрос…' : 'Повторить'}
            </Button>
          }
        />
      ) : null}

      {!isPending && !isError && data?.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Пока нет матчей"
          description="После генерации сетки турнира матчи появятся здесь автоматически."
        />
      ) : null}

      {!isPending && !isError && data && data.length > 0 ? (
        <>
          <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
            Всего записей: <span className="font-semibold text-foreground">{data.length}</span>.{' '}
            <Link to="/tournaments" className="text-primary underline-offset-4 hover:underline">
              Список турниров
            </Link>
          </p>
          <div className="hidden rounded-xl border border-border/90 bg-card/40 shadow-inner-glow backdrop-blur-sm md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border/80 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Турнир</TableHead>
                  <TableHead className="text-muted-foreground">Стадия</TableHead>
                  <TableHead className="text-muted-foreground">Команда A</TableHead>
                  <TableHead className="text-center text-muted-foreground">Счёт</TableHead>
                  <TableHead className="text-muted-foreground">Команда B</TableHead>
                  <TableHead className="text-muted-foreground">Победитель</TableHead>
                  <TableHead className="w-[1%] text-muted-foreground" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((m) => {
                  const totalRounds = maxRoundByTournamentId.get(m.tournamentId) ?? m.round
                  const stage = matchStageLabel(m.tournament.format, m.round, totalRounds)
                  return (
                    <TableRow key={m.id} className="border-border/80">
                      <TableCell className="max-w-[14rem]">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border/90 bg-muted/30">
                            <SafeImage
                              src={m.tournament.avatarUrl}
                              alt=""
                              fallback={<Trophy className="m-auto h-3.5 w-3.5 text-primary/45" aria-hidden />}
                              className="h-full w-full"
                            />
                          </div>
                          <Link
                            to={`/tournaments/${m.tournament.id}`}
                            className="min-w-0 truncate font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {m.tournament.title}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{stage}</TableCell>
                      <TableCell className="max-w-[8rem] truncate">{m.teamA?.name ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-center font-mono text-xs">
                        {scoreLine(m.scoreA, m.scoreB)}
                      </TableCell>
                      <TableCell className="max-w-[8rem] truncate">{m.teamB?.name ?? '—'}</TableCell>
                      <TableCell className="max-w-[8rem] truncate text-foreground">
                        {m.winner?.name ??
                          (m.scoreA != null && m.scoreB != null && m.scoreA === m.scoreB
                            ? 'Ничья'
                            : m.winnerId
                              ? 'Определён'
                              : '—')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          <Link to={`/tournaments/${m.tournament.id}`}>К турниру</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {data.map((m) => {
              const totalRounds = maxRoundByTournamentId.get(m.tournamentId) ?? m.round
              const stage = matchStageLabel(m.tournament.format, m.round, totalRounds)
              return (
                <li
                  key={m.id}
                  className="rounded-xl border border-border/90 bg-card/45 p-4 shadow-inner-glow backdrop-blur-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage}</p>
                  <div className="mt-1 flex min-w-0 items-center gap-2">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border/90 bg-muted/30">
                      <SafeImage
                        src={m.tournament.avatarUrl}
                        alt=""
                        fallback={<Trophy className="m-auto h-4 w-4 text-primary/45" aria-hidden />}
                        className="h-full w-full"
                      />
                    </div>
                    <p className="min-w-0 flex-1 font-medium leading-snug">
                      <Link to={`/tournaments/${m.tournament.id}`} className="text-primary hover:underline">
                        {m.tournament.title}
                      </Link>
                    </p>
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="font-medium">{m.teamA?.name ?? '—'}</span>
                    <span className="mx-2 font-mono text-muted-foreground">{scoreLine(m.scoreA, m.scoreB)}</span>
                    <span className="font-medium">{m.teamB?.name ?? '—'}</span>
                  </p>
                  {m.scoreA != null && m.scoreB != null && m.scoreA === m.scoreB ? (
                    <p className="mt-2 text-xs text-muted-foreground">Результат: ничья</p>
                  ) : m.winner?.name ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Победитель: <span className="font-semibold text-foreground">{m.winner.name}</span>
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </PageContainer>
  )
}
