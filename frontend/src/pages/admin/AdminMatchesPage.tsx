import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { matchStageLabel } from '@/features/tournament-bracket/model/roundLabel'
import { useAdminMatchesQuery } from '@/features/admin/api/useAdminMatchesQuery'
import type { BracketMatchWithTournamentDto } from '@/shared/api/services/matchService'
import { PageLoader } from '@/shared/ui/PageLoader'
import { AdminCrudTable, type AdminTableColumn } from '@/widgets/admin-dashboard/ui/AdminCrudTable'

type MatchRow = {
  id: string
  tournamentId: string
  tournament: string
  home: string
  away: string
  stage: string
  score: string
  state: 'scheduled' | 'in_progress' | 'finished'
}

function teamName(team: { name: string } | null) {
  return team?.name ?? 'TBD'
}

function matchState(m: BracketMatchWithTournamentDto): MatchRow['state'] {
  if (m.winnerId) return 'finished'
  if (m.scoreA != null && m.scoreB != null) return 'in_progress'
  if (m.teamAId && m.teamBId) return 'scheduled'
  return 'scheduled'
}

function stateBadge(s: MatchRow['state']) {
  if (s === 'in_progress') return <Badge variant="destructive">идёт</Badge>
  if (s === 'finished') return <Badge variant="secondary">завершён</Badge>
  return <Badge variant="outline">запланирован</Badge>
}

function scoreLine(scoreA: number | null, scoreB: number | null) {
  if (scoreA != null && scoreB != null) return `${scoreA} : ${scoreB}`
  return '—'
}

export function AdminMatchesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const enabled = user?.role === 'ADMIN'
  const { data: matches, isPending, isError, error, refetch, isFetching } = useAdminMatchesQuery(enabled)

  const maxRoundByTournamentId = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of matches ?? []) {
      const cur = m.get(row.tournamentId) ?? 0
      if (row.round > cur) m.set(row.tournamentId, row.round)
    }
    return m
  }, [matches])

  const rows: MatchRow[] = useMemo(() => {
    if (!matches) return []
    return matches.map((m) => {
      const totalRounds = maxRoundByTournamentId.get(m.tournamentId) ?? m.round
      return {
        id: m.id,
        tournamentId: m.tournamentId,
        tournament: m.tournament.title,
        home: teamName(m.teamA),
        away: teamName(m.teamB),
        stage: matchStageLabel(m.tournament.format, m.round, totalRounds),
        score: scoreLine(m.scoreA, m.scoreB),
        state: matchState(m),
      }
    })
  }, [matches, maxRoundByTournamentId])

  const stats = useMemo(() => {
    const inProgress = rows.filter((r) => r.state === 'in_progress').length
    const done = rows.filter((r) => r.state === 'finished').length
    return { total: rows.length, inProgress, done }
  }, [rows])

  const columns: AdminTableColumn<MatchRow>[] = [
    { id: 'tournament', header: 'Турнир', cell: (r) => <span className="font-medium">{r.tournament}</span> },
    { id: 'pair', header: 'Пара', cell: (r) => `${r.home} vs ${r.away}` },
    { id: 'stage', header: 'Стадия', cell: (r) => r.stage },
    { id: 'score', header: 'Счёт', cell: (r) => <span className="tabular-nums">{r.score}</span> },
    { id: 'state', header: 'Статус', cell: (r) => stateBadge(r.state) },
  ]

  if (!enabled) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Таблица</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Матчи</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Все матчи платформы. Редактирование счёта — на странице турнира.
          </p>
        </motion.div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" disabled={isFetching} onClick={() => void refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/tournaments/matches">Лента матчей</Link>
          </Button>
        </div>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Не удалось загрузить матчи'}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Всего</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.total}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Со счётом</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-destructive">{isPending ? '…' : stats.inProgress}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Завершено</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.done}</CardContent>
        </Card>
      </div>

      {isPending ? (
        <PageLoader message="Загрузка матчей…" />
      ) : (
        <AdminCrudTable
          caption="Матчи в базе"
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          emptyLabel="Матчей пока нет"
          onView={(row) => navigate(`/tournaments/${row.tournamentId}`)}
          onEdit={(row) => navigate(`/tournaments/${row.tournamentId}`)}
        />
      )}
    </div>
  )
}
