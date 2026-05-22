import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import type { Team } from '@/entities/team/model/types'
import { useAdminTeamsQuery } from '@/features/admin/api/useAdminTeamsQuery'
import { useDeleteTeamMutation } from '@/features/team/api/useTeamMutations'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { PageLoader } from '@/shared/ui/PageLoader'
import { AdminCrudTable, type AdminTableColumn } from '@/widgets/admin-dashboard/ui/AdminCrudTable'

type TeamRow = {
  id: string
  name: string
  tournamentId: string
  tournament: string
  roster: number
  createdAt: string
}

export function AdminTeamsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const enabled = user?.role === 'ADMIN'
  const { data: teams, isPending, isError, error, refetch, isFetching } = useAdminTeamsQuery(enabled)
  const deleteMutation = useDeleteTeamMutation()

  const rows: TeamRow[] = useMemo(() => {
    if (!teams) return []
    return teams.map((t: Team) => ({
      id: t.id,
      name: t.name,
      tournamentId: t.tournamentId,
      tournament: t.tournament.title,
      roster: t.players.length,
      createdAt: t.createdAt,
    }))
  }, [teams])

  const stats = useMemo(() => {
    const roster = rows.reduce((a, r) => a + r.roster, 0)
    const tournaments = new Set(rows.map((r) => r.tournamentId)).size
    return { total: rows.length, roster, tournaments }
  }, [rows])

  const columns: AdminTableColumn<TeamRow>[] = [
    { id: 'name', header: 'Команда', cell: (r) => <span className="font-medium">{r.name}</span> },
    { id: 'tournament', header: 'Турнир', cell: (r) => <span className="text-muted-foreground">{r.tournament}</span> },
    { id: 'roster', header: 'Игроков', cell: (r) => r.roster, className: 'tabular-nums' },
    {
      id: 'createdAt',
      header: 'Создана',
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {new Date(r.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
  ]

  const handleDelete = async (row: TeamRow) => {
    try {
      await deleteMutation.mutateAsync({ tournamentId: row.tournamentId, teamId: row.id })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Команда удалена')
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
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Команды</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Все команды из базы. Управление составом — в разделе «Команды» или на странице турнира.
          </p>
        </motion.div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" disabled={isFetching} onClick={() => void refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Button type="button" className="shrink-0 gap-2" asChild>
            <Link to="/teams" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Управление командами
            </Link>
          </Button>
        </div>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Не удалось загрузить команды'}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Команд</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.total}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Турниров</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-400">{isPending ? '…' : stats.tournaments}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Игроков (сумма)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.roster}</CardContent>
        </Card>
      </div>

      {isPending ? (
        <PageLoader message="Загрузка команд…" />
      ) : (
        <AdminCrudTable
          caption="Команды в базе"
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          emptyLabel="Команд пока нет"
          onView={(row) => navigate(`/tournaments/${row.tournamentId}`)}
          onEdit={() => navigate('/teams')}
          onDelete={(row) => void handleDelete(row)}
        />
      )}
    </div>
  )
}
