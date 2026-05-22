import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useAdminFantasyTeamsQuery, type AdminFantasyTeamListItem } from '@/features/admin/api/useAdminFantasyTeamsQuery'
import { PageLoader } from '@/shared/ui/PageLoader'
import { AdminChartPlaceholder } from '@/widgets/admin-dashboard/ui/AdminChartPlaceholder'
import { AdminCrudTable, type AdminTableColumn } from '@/widgets/admin-dashboard/ui/AdminCrudTable'

export function AdminFantasyLeaguePage() {
  const { user } = useAuth()
  const enabled = user?.role === 'ADMIN'
  const { data, isPending, isError, error, refetch, isFetching } = useAdminFantasyTeamsQuery(enabled)

  const rows = data ?? []

  const stats = useMemo(() => {
    const tournaments = new Set(rows.map((r) => r.tournamentId)).size
    const points = rows.reduce((a, r) => a + r.points, 0)
    return { teams: rows.length, tournaments, points }
  }, [rows])

  const columns: AdminTableColumn<AdminFantasyTeamListItem>[] = [
    {
      id: 'user',
      header: 'Участник',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.userEmail}</p>
          <p className="truncate text-xs text-muted-foreground">{r.userDisplayName?.trim() || '—'}</p>
        </div>
      ),
    },
    {
      id: 'tournament',
      header: 'Турнир',
      cell: (r) => (
        <Link
          to={`/tournaments/${r.tournamentId}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {r.tournamentTitle}
        </Link>
      ),
    },
    {
      id: 'fantasyName',
      header: 'Название состава',
      cell: (r) => <span className="text-muted-foreground">{r.fantasyTeamName?.trim() || 'Без названия'}</span>,
    },
    {
      id: 'points',
      header: 'Очки',
      cell: (r) => <span className="tabular-nums font-semibold">{r.points}</span>,
      className: 'text-right',
    },
    {
      id: 'updatedAt',
      header: 'Обновлено',
      cell: (r) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {new Date(r.updatedAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
  ]

  if (user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Фэнтези-лига</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Составы по турнирам</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Все составы фэнтези по турнирам: владелец, турнир и название команды.
          </p>
        </motion.div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-2"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Не удалось загрузить'}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Составов</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.teams}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Турниров</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-400">{isPending ? '…' : stats.tournaments}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Сумма очков</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.points}</CardContent>
        </Card>
      </div>

      <AdminChartPlaceholder
        title="Очки по турнирам"
        description="Здесь будет наглядное сравнение очков по турнирам, когда понадобится отдельный график."
        delay={0}
      />

      {isPending ? (
        <PageLoader message="Загрузка составов…" />
      ) : (
        <AdminCrudTable
          caption="Фэнтези-команды: владелец и турнир"
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          emptyLabel="Составов пока нет"
        />
      )}
    </div>
  )
}
