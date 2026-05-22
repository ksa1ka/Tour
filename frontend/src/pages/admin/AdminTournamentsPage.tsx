import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import type { Tournament, TournamentStatus } from '@/entities/tournament/model/types'
import { useAdminTeamsQuery } from '@/features/admin/api/useAdminTeamsQuery'
import { useAdminTournamentsQuery } from '@/features/admin/api/useAdminTournamentsQuery'
import { useDeleteTournamentMutation } from '@/features/tournament/api/useTournamentMutations'
import { ADMIN_ROUTES } from '@/shared/constants/adminRoutes'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { tournamentFormatLabel, tournamentGameLabel, tournamentStatusLabel } from '@/shared/lib/tournamentLabels'
import { PageLoader } from '@/shared/ui/PageLoader'
import { AdminCrudTable, type AdminTableColumn } from '@/widgets/admin-dashboard/ui/AdminCrudTable'

type TournamentRow = {
  id: string
  title: string
  game: string
  format: string
  status: TournamentStatus
  teams: number
}

function statusBadge(status: TournamentStatus) {
  if (status === 'IN_PROGRESS') return <Badge variant="success">{tournamentStatusLabel(status)}</Badge>
  if (status === 'DRAFT' || status === 'OPEN' || status === 'REGISTRATION')
    return <Badge variant="warning">{tournamentStatusLabel(status)}</Badge>
  return <Badge variant="secondary">{tournamentStatusLabel(status)}</Badge>
}

export function AdminTournamentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const enabled = user?.role === 'ADMIN'
  const { data: tournaments, isPending, isError, error, refetch, isFetching } = useAdminTournamentsQuery(enabled)
  const { data: teams } = useAdminTeamsQuery(enabled)
  const deleteMutation = useDeleteTournamentMutation()

  const teamCountByTournamentId = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of teams ?? []) {
      m.set(t.tournamentId, (m.get(t.tournamentId) ?? 0) + 1)
    }
    return m
  }, [teams])

  const rows: TournamentRow[] = useMemo(() => {
    if (!tournaments) return []
    return tournaments.map((t: Tournament) => ({
      id: t.id,
      title: t.title,
      game: tournamentGameLabel(t.game),
      format: tournamentFormatLabel(t.format),
      status: t.status,
      teams: teamCountByTournamentId.get(t.id) ?? 0,
    }))
  }, [tournaments, teamCountByTournamentId])

  const stats = useMemo(() => {
    const live = rows.filter((r) => r.status === 'IN_PROGRESS').length
    const teamTotal = rows.reduce((a, r) => a + r.teams, 0)
    return { total: rows.length, live, teams: teamTotal }
  }, [rows])

  const columns: AdminTableColumn<TournamentRow>[] = [
    { id: 'title', header: 'Название', cell: (r) => <span className="font-medium">{r.title}</span> },
    { id: 'game', header: 'Игра', cell: (r) => r.game },
    { id: 'format', header: 'Формат', cell: (r) => r.format },
    { id: 'status', header: 'Статус', cell: (r) => statusBadge(r.status) },
    { id: 'teams', header: 'Команд', cell: (r) => r.teams, className: 'text-right tabular-nums' },
  ]

  const handleDelete = async (row: TournamentRow) => {
    try {
      await deleteMutation.mutateAsync(row.id)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Турнир удалён')
    } catch (err) {
      toast.error(getRestErrorMessage(err))
    }
  }

  if (!enabled) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Таблица</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Турниры</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Актуальный список из базы данных. Редактирование — на странице турнира.
          </p>
        </motion.div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" disabled={isFetching} onClick={() => void refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={ADMIN_ROUTES.root}>На дашборд</Link>
          </Button>
          <Button type="button" className="gap-2" asChild>
            <Link to="/tournaments/new" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Новый турнир
            </Link>
          </Button>
        </div>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Не удалось загрузить турниры'}</p>
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
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Идут сейчас</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-400">{isPending ? '…' : stats.live}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Команд (сумма)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.teams}</CardContent>
        </Card>
      </div>

      {isPending ? (
        <PageLoader message="Загрузка турниров…" />
      ) : (
        <AdminCrudTable
          caption="Турниры в базе"
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          emptyLabel="Турниров пока нет"
          onView={(row) => navigate(`/tournaments/${row.id}`)}
          onEdit={(row) => navigate(`/tournaments/${row.id}`)}
          onDelete={(row) => void handleDelete(row)}
        />
      )}
    </div>
  )
}
