import { motion } from 'framer-motion'
import { LifeBuoy, RefreshCw, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import {
  useAdminSupportReplyMutation,
  useAdminSupportStatusMutation,
  useAdminSupportTicketQuery,
  useAdminSupportTicketsQuery,
} from '@/features/admin/api/useAdminSupportTicketsQuery'
import {
  supportCategoryLabel,
  type SupportTicketListItem,
  type SupportTicketStatus,
} from '@/features/support/api/supportService'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { cn } from '@/shared/lib/utils'
import { AdminCrudTable, type AdminTableColumn } from '@/widgets/admin-dashboard/ui/AdminCrudTable'

const STATUS_FILTERS: { value: SupportTicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'OPEN', label: 'Открытые' },
  { value: 'CLOSED', label: 'Закрытые' },
]

export function AdminSupportPage() {
  const { user } = useAuth()
  const enabled = user?.role === 'ADMIN'
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | 'all'>('OPEN')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reply, setReply] = useState('')

  const selectTicket = (id: string) => {
    setSelectedId(id)
    setReply('')
  }

  const statusParam = statusFilter === 'all' ? undefined : statusFilter
  const listQuery = useAdminSupportTicketsQuery(enabled, statusParam)
  const ticketQuery = useAdminSupportTicketQuery(enabled, selectedId)
  const replyMutation = useAdminSupportReplyMutation(selectedId)
  const statusMutation = useAdminSupportStatusMutation(selectedId)

  const rows = listQuery.data ?? []
  const ticket = ticketQuery.data
  const ticketReady = ticket?.id === selectedId
  const ticketLoading = Boolean(selectedId) && (ticketQuery.isPending || (ticketQuery.isFetching && !ticketReady))

  const stats = useMemo(() => {
    const open = rows.filter((r) => r.status === 'OPEN').length
    return { total: rows.length, open }
  }, [rows])

  const columns: AdminTableColumn<SupportTicketListItem>[] = [
    {
      id: 'topic',
      header: 'Тема',
      cell: (r) => (
        <button
          type="button"
          className="max-w-[220px] truncate text-left font-medium text-foreground hover:text-primary"
          onClick={() => selectTicket(r.id)}
        >
          {r.topic}
        </button>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      cell: (r) => <span className="truncate text-sm">{r.email}</span>,
    },
    {
      id: 'category',
      header: 'Категория',
      cell: (r) => <span className="text-sm text-muted-foreground">{supportCategoryLabel(r.category)}</span>,
    },
    {
      id: 'status',
      header: 'Статус',
      cell: (r) => (
        <span
          className={cn(
            'inline-flex rounded-md px-2 py-0.5 text-xs font-semibold',
            r.status === 'OPEN' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-muted text-muted-foreground',
          )}
        >
          {r.status === 'OPEN' ? 'Открыто' : 'Закрыто'}
        </span>
      ),
    },
    {
      id: 'msgs',
      header: 'Сообщ.',
      cell: (r) => <span className="tabular-nums">{r.messageCount}</span>,
      className: 'w-[1%] whitespace-nowrap',
    },
    {
      id: 'updated',
      header: 'Обновлено',
      cell: (r) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {new Date(r.updatedAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
  ]

  const handleReply = () => {
    const text = reply.trim()
    if (!text || !selectedId) return
    replyMutation.mutate(text, {
      onSuccess: () => {
        setReply('')
        toast.success('Ответ отправлен')
      },
      onError: (err) => toast.error(getRestErrorMessage(err, 'Не удалось отправить ответ')),
    })
  }

  const toggleStatus = () => {
    if (!ticket) return
    const next: SupportTicketStatus = ticket.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    statusMutation.mutate(next, {
      onSuccess: () => toast.success(next === 'CLOSED' ? 'Обращение закрыто' : 'Обращение открыто'),
      onError: (err) => toast.error(getRestErrorMessage(err, 'Не удалось изменить статус')),
    })
  }

  if (user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Поддержка</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <LifeBuoy className="h-7 w-7 text-primary" />
            Обращения пользователей
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Просмотр переписки и ответы пользователям. В текущей выборке: {stats.total}
            {statusFilter === 'all' ? `, открытых: ${stats.open}` : null}.
          </p>
        </motion.div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={listQuery.isFetching}
          onClick={() => {
            void listQuery.refetch()
            if (selectedId) void ticketQuery.refetch()
          }}
        >
          <RefreshCw className={cn('h-4 w-4', listQuery.isFetching && 'animate-spin')} />
          Обновить
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            type="button"
            size="sm"
            variant={statusFilter === f.value ? 'default' : 'outline'}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Список обращений</CardTitle>
          </CardHeader>
          <CardContent>
            {listQuery.isPending ? (
              <p className="text-sm text-muted-foreground">Загрузка…</p>
            ) : listQuery.isError ? (
              <p className="text-sm text-destructive">{getRestErrorMessage(listQuery.error)}</p>
            ) : (
              <AdminCrudTable
                data={rows}
                columns={columns}
                getRowId={(r) => r.id}
                emptyLabel="Обращений пока нет"
                onView={(r) => selectTicket(r.id)}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {ticket ? `${ticket.topic} (${ticket.publicId})` : 'Выберите обращение'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">Нажмите на строку в таблице слева.</p>
            ) : ticketLoading ? (
              <p className="text-sm text-muted-foreground">Загрузка переписки…</p>
            ) : ticketQuery.isError || !ticketReady ? (
              <p className="text-sm text-destructive">{getRestErrorMessage(ticketQuery.error, 'Ошибка загрузки')}</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>
                    {ticket.email} · {supportCategoryLabel(ticket.category)}
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={toggleStatus} disabled={statusMutation.isPending}>
                    {ticket.status === 'OPEN' ? 'Закрыть обращение' : 'Открыть снова'}
                  </Button>
                </div>

                <div className="flex max-h-[min(50dvh,400px)] flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/15 p-3">
                  {(ticket.messages ?? []).map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'max-w-[92%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                        m.role === 'ADMIN'
                          ? 'ml-auto border border-primary/25 bg-primary/10'
                          : 'mr-auto border border-border bg-card',
                      )}
                    >
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {m.role === 'ADMIN' ? 'Вы (поддержка)' : 'Пользователь'} ·{' '}
                        {new Date(m.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                </div>

                {ticket.status === 'OPEN' ? (
                  <div className="space-y-2 border-t border-border pt-2">
                    <Label htmlFor="admin-support-reply">Ответ пользователю</Label>
                    <Textarea
                      id="admin-support-reply"
                      rows={4}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Текст ответа — пользователь увидит его в поддержке на сайте"
                    />
                    <Button type="button" disabled={replyMutation.isPending || reply.trim().length < 1} onClick={handleReply}>
                      <Send className="h-4 w-4" />
                      {replyMutation.isPending ? 'Отправка…' : 'Отправить ответ'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Обращение закрыто. Откройте его, чтобы ответить.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
