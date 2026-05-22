import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import {
  fetchSupportTicket,
  sendSupportFollowUp,
  supportCategoryLabel,
  type SupportTicketDetail,
} from '@/features/support/api/supportService'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { cn } from '@/shared/lib/utils'

type SupportTicketThreadProps = {
  publicId: string
  emailFallback?: string
  onBack: () => void
}

export function SupportTicketThread({ publicId, emailFallback, onBack }: SupportTicketThreadProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const email = user?.email ?? emailFallback ?? ''

  const ticketQuery = useQuery({
    queryKey: ['support', 'ticket', publicId, email],
    queryFn: () => fetchSupportTicket(publicId, user ? undefined : email),
    enabled: !!publicId && (!!user || !!email),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  })

  const [reply, setReply] = useState('')

  const replyMutation = useMutation({
    mutationFn: (message: string) => sendSupportFollowUp(publicId, { email, message }),
    onSuccess: (ticket) => {
      queryClient.setQueryData(['support', 'ticket', publicId, email], ticket)
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] })
      setReply('')
      toast.success('Сообщение отправлено')
    },
    onError: (err) => {
      toast.error(getRestErrorMessage(err, 'Не удалось отправить сообщение.'))
    },
  })

  const ticket = ticketQuery.data

  if (ticketQuery.isPending) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Загрузка переписки…</p>
  }

  if (ticketQuery.isError || !ticket) {
    return (
      <div className="space-y-4 py-4">
        <p className="text-sm text-destructive">
          {getRestErrorMessage(ticketQuery.error, 'Не удалось загрузить обращение.')}
        </p>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
      </div>
    )
  }

  return (
    <SupportTicketThreadView
      ticket={ticket}
      reply={reply}
      onReplyChange={setReply}
      onBack={onBack}
      onSubmit={() => {
        const text = reply.trim()
        if (text.length < 1) return
        replyMutation.mutate(text)
      }}
      isSubmitting={replyMutation.isPending}
      canReply={ticket.status === 'OPEN'}
    />
  )
}

function SupportTicketThreadView({
  ticket,
  reply,
  onReplyChange,
  onBack,
  onSubmit,
  isSubmitting,
  canReply,
}: {
  ticket: SupportTicketDetail
  reply: string
  onReplyChange: (v: string) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  canReply: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onBack} aria-label="Назад">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {supportCategoryLabel(ticket.category)} · {ticket.publicId}
          </p>
          <h3 className="truncate text-base font-semibold text-foreground">{ticket.topic}</h3>
          <p className="text-xs text-muted-foreground">
            {ticket.status === 'OPEN' ? 'Открыто' : 'Закрыто'} · {ticket.messageCount} сообщ.
          </p>
        </div>
      </div>

      <div className="flex max-h-[min(42dvh,360px)] flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/15 p-3">
        {(ticket.messages ?? []).map((m) => (
          <div
            key={m.id}
            className={cn(
              'max-w-[92%] rounded-lg px-3 py-2 text-sm leading-relaxed',
              m.role === 'ADMIN'
                ? 'ml-auto border border-primary/25 bg-primary/10 text-foreground'
                : 'mr-auto border border-border bg-card text-foreground',
            )}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {m.role === 'ADMIN' ? 'Поддержка' : 'Вы'} ·{' '}
              {new Date(m.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
            <p className="whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>

      {canReply ? (
        <div className="space-y-2 border-t border-border pt-2">
          <Label htmlFor="support-reply">Ваш ответ</Label>
          <Textarea
            id="support-reply"
            rows={3}
            value={reply}
            onChange={(e) => onReplyChange(e.target.value)}
            placeholder="Напишите уточнение или дополнение"
            className="min-h-[88px] resize-y"
          />
          <Button type="button" disabled={isSubmitting || reply.trim().length < 1} onClick={onSubmit}>
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Отправка…' : 'Отправить'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Обращение закрыто. Создайте новое, если вопрос остался.</p>
      )}
    </div>
  )
}
