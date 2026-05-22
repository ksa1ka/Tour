import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import {
  useAdminShopPurchasesQuery,
  type AdminRewardPurchaseListItem,
} from '@/features/admin/api/useAdminShopPurchasesQuery'
import { PageLoader } from '@/shared/ui/PageLoader'
import { AdminCrudTable, type AdminTableColumn } from '@/widgets/admin-dashboard/ui/AdminCrudTable'

export function AdminShopPurchasesPage() {
  const { user } = useAuth()
  const enabled = user?.role === 'ADMIN'
  const { data, isPending, isError, error, refetch, isFetching } = useAdminShopPurchasesQuery(enabled)

  const rows = data ?? []

  const stats = useMemo(() => {
    const totalQty = rows.reduce((a, r) => a + r.quantity, 0)
    const uniqueBuyers = new Set(rows.map((r) => r.userId)).size
    return { rows: rows.length, totalQty, uniqueBuyers }
  }, [rows])

  const columns: AdminTableColumn<AdminRewardPurchaseListItem>[] = [
    {
      id: 'buyer',
      header: 'Покупатель',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.userEmail}</p>
          <p className="truncate text-xs text-muted-foreground">{r.userDisplayName?.trim() || '—'}</p>
        </div>
      ),
    },
    {
      id: 'reward',
      header: 'Награда',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.rewardTitle}</p>
          <p className="text-xs text-muted-foreground">Цена в каталоге: {r.rewardPrice} очков</p>
        </div>
      ),
    },
    {
      id: 'quantity',
      header: 'Кол-во',
      cell: (r) => <span className="tabular-nums font-medium">{r.quantity}</span>,
      className: 'w-[1%] whitespace-nowrap',
    },
    {
      id: 'acquiredAt',
      header: 'Когда',
      cell: (r) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {new Date(r.acquiredAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Магазин наград</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Покупки наград</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Кто купил, какой предмет по названию из каталога и сколько единиц — данные из базы.
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
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Строк в таблице</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.rows}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Всего единиц</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.totalQty}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Покупателей</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{isPending ? '…' : stats.uniqueBuyers}</CardContent>
        </Card>
      </div>

      {isPending ? (
        <PageLoader message="Загрузка покупок…" />
      ) : (
        <AdminCrudTable
          caption="Инвентарь пользователей: кто купил и какая награда (из базы)"
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          emptyLabel="Покупок пока нет"
        />
      )}
    </div>
  )
}
