import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useAdminUsersQuery } from '@/features/admin/api/useAdminUsersQuery'
import { accountCategoryLabel } from '@/shared/lib/userAccountLabel'
import { PageLoader } from '@/shared/ui/PageLoader'
import { AdminCrudTable, type AdminTableColumn } from '@/widgets/admin-dashboard/ui/AdminCrudTable'

type Row = {
  id: string
  email: string
  displayName: string | null
  role: string
  fantasyPointsBalance: number
  createdAt: string
}

export function AdminUsersPage() {
  const { user } = useAuth()
  const { data: users, isPending, isError, error, refetch, isFetching } = useAdminUsersQuery(user?.role === 'ADMIN')

  const rows: Row[] = useMemo(() => {
    if (!users) return []
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      fantasyPointsBalance: u.fantasyPointsBalance,
      createdAt: u.createdAt,
    }))
  }, [users])

  const stats = useMemo(() => {
    const admins = rows.filter((r) => r.role === 'ADMIN').length
    const viewers = rows.filter((r) => r.role === 'VIEWER').length
    const players = rows.filter((r) => r.role === 'PLAYER').length
    return { total: rows.length, admins, viewers, players }
  }, [rows])

  const columns: AdminTableColumn<Row>[] = [
    { id: 'email', header: 'Email', cell: (r) => <span className="font-medium text-foreground">{r.email}</span> },
    {
      id: 'displayName',
      header: 'Имя',
      cell: (r) => <span className="text-muted-foreground">{r.displayName?.trim() || '—'}</span>,
    },
    {
      id: 'category',
      header: 'Категория',
      cell: (r) => (
        <Badge variant={r.role === 'ADMIN' ? 'default' : 'secondary'}>{accountCategoryLabel(r.role)}</Badge>
      ),
    },
    {
      id: 'fantasyPointsBalance',
      header: 'Баланс очков',
      cell: (r) => <span className="tabular-nums font-medium text-foreground">{r.fantasyPointsBalance}</span>,
      className: 'text-right',
    },
    {
      id: 'createdAt',
      header: 'Регистрация',
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {new Date(r.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Пользователи</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Зарегистрированные аккаунты</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Список из базы данных: зритель и игрок задаются при регистрации, отдельно от прав администратора.
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
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Не удалось загрузить список'}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Всего</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.total}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Зрители</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-foreground">{isPending ? '…' : stats.viewers}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Игроки</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-foreground">{isPending ? '…' : stats.players}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Админы</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-foreground">{isPending ? '…' : stats.admins}</CardContent>
        </Card>
      </div>

      {isPending ? (
        <PageLoader message="Загрузка пользователей…" />
      ) : (
        <AdminCrudTable
          caption="Пользователи сайта"
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          emptyLabel="Пользователей пока нет"
        />
      )}
    </div>
  )
}
