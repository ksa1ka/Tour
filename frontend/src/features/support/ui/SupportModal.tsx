import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronDown, LifeBuoy, MessageSquare, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import {
  SUPPORT_CATEGORIES,
  fetchMySupportTickets,
  sendSupportMessage,
  supportCategoryLabel,
  type SupportCategory,
} from '@/features/support/api/supportService'
import { SupportTicketThread } from '@/features/support/ui/SupportTicketThread'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { cn } from '@/shared/lib/utils'
import { nativeSelectClassName } from '@/shared/ui/NativeSelectField'

const supportFormSchema = z.object({
  email: z.string().trim().email('Укажите корректный email'),
  category: z.enum(['general', 'technical', 'tournaments', 'fantasy', 'account', 'other']),
  topic: z
    .string()
    .trim()
    .min(3, 'Тема не короче 3 символов')
    .max(200, 'Тема не длиннее 200 символов'),
  message: z
    .string()
    .trim()
    .min(10, 'Сообщение не короче 10 символов')
    .max(8000, 'Сообщение слишком длинное'),
})

type SupportFormValues = z.infer<typeof supportFormSchema>

const defaultValues: SupportFormValues = {
  email: '',
  category: 'general',
  topic: '',
  message: '',
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Как зарегистрироваться и выбрать роль?',
    a: 'Нажмите «Регистрация», укажите email и пароль. При регистрации можно выбрать категорию аккаунта: зритель или игрок — это влияет на доступные сценарии участия.',
  },
  {
    q: 'Где посмотреть расписание матчей турнира?',
    a: 'Откройте страницу турнира из раздела «Турниры»: там отображаются этапы и матчи. Детали зависят от настроек конкретного турнира.',
  },
  {
    q: 'Что такое фэнтези-лига?',
    a: 'Это отдельный режим прогнозов по матчам турнира с таблицей лидеров. Перейдите на страницу турнира и выберите пункт фэнтези-лиги, если он включён для события.',
  },
  {
    q: 'Где увидеть ответ поддержки?',
    a: 'Войдите в аккаунт и откройте «Поддержка» → «Мои обращения». Там вся переписка, включая ответы администратора.',
  },
  {
    q: 'Как сообщить об ошибке на сайте?',
    a: 'Выберите категорию «Техническая проблема», опишите шаги воспроизведения и укажите браузер и устройство.',
  },
]

type SupportView = 'new' | 'list' | 'thread'

type SupportModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [view, setView] = useState<SupportView>('new')
  const [threadPublicId, setThreadPublicId] = useState<string | null>(null)
  const [lookupId, setLookupId] = useState('')
  const [lookupEmail, setLookupEmail] = useState('')

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = form

  useEffect(() => {
    if (!open) {
      setView('new')
      setThreadPublicId(null)
      return
    }
    if (user?.email) {
      setValue('email', user.email, { shouldValidate: true })
      setLookupEmail(user.email)
    }
  }, [open, user?.email, setValue])

  const ticketsQuery = useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: fetchMySupportTickets,
    enabled: open && !!user && view === 'list',
  })

  const mutation = useMutation({
    mutationFn: sendSupportMessage,
    onSuccess: (data, variables) => {
      toast.success(data.message, { description: `Номер: ${data.ticketId}` })
      reset(defaultValues)
      if (user?.email) {
        setValue('email', user.email)
      }
      setLookupId(data.ticketId)
      setLookupEmail(variables.email)
      setThreadPublicId(data.ticketId)
      setView('thread')
      if (user) {
        void queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] })
      }
    },
    onError: (err) => {
      toast.error(getRestErrorMessage(err, 'Не удалось отправить сообщение.'))
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      email: values.email,
      category: values.category as SupportCategory,
      topic: values.topic,
      message: values.message,
    })
  })

  const openThread = (publicId: string) => {
    setThreadPublicId(publicId)
    setView('thread')
  }

  const tabs = (
    <div className="flex flex-wrap gap-2 border-b border-border px-5 pb-3 pt-1 sm:px-6">
      <Button
        type="button"
        size="sm"
        variant={view === 'new' ? 'default' : 'outline'}
        onClick={() => setView('new')}
      >
        Новое обращение
      </Button>
      {user ? (
        <Button
          type="button"
          size="sm"
          variant={view === 'list' ? 'default' : 'outline'}
          onClick={() => setView('list')}
        >
          Мои обращения
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant={view === 'thread' ? 'default' : 'outline'}
          onClick={() => setView('thread')}
        >
          По номеру
        </Button>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[min(92dvh,880px)] w-full max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl',
        )}
      >
        <motion.div
          initial={false}
          animate={open ? { opacity: 1, y: 0 } : { opacity: 0.92, y: 8 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogHeader className="shrink-0 space-y-1 border-b border-border px-5 pb-2 pt-5 text-left sm:px-6 sm:pt-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary">
                <LifeBuoy className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight">Поддержка</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {user
                    ? 'Создайте обращение или откройте переписку — все сообщения сохраняются.'
                    : 'Напишите нам. После отправки сохраните номер обращения для просмотра ответа.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {tabs}

          <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-2 md:divide-x md:divide-border">
            {view === 'new' ? (
              <>
                <section className="order-2 flex flex-col gap-3 border-t border-border p-5 sm:p-6 md:order-1 md:border-t-0 md:overflow-y-auto">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Частые вопросы</h3>
                  <div className="flex flex-col gap-2">
                    {FAQ_ITEMS.map((item) => (
                      <details
                        key={item.q}
                        className="group rounded-lg border border-border bg-muted/20 px-3 py-2 transition-colors open:bg-muted/35"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                          <span>{item.q}</span>
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                        </summary>
                        <p className="border-t border-border/60 pb-1 pt-2 text-sm leading-relaxed text-muted-foreground">
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>

                <section className="order-1 flex flex-col gap-4 p-5 sm:p-6 md:order-2 md:overflow-y-auto">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Обращение</h3>
                  <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="support-category">Категория</Label>
                      <select
                        id="support-category"
                        className={nativeSelectClassName}
                        {...register('category')}
                      >
                        {SUPPORT_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      {errors.category ? <p className="text-sm text-destructive">{errors.category.message}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="support-email">Email</Label>
                      <Input
                        id="support-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        aria-invalid={!!errors.email}
                        {...register('email')}
                      />
                      {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="support-topic">Тема</Label>
                      <Input
                        id="support-topic"
                        placeholder="Кратко опишите суть"
                        aria-invalid={!!errors.topic}
                        {...register('topic')}
                      />
                      {errors.topic ? <p className="text-sm text-destructive">{errors.topic.message}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="support-message">Сообщение</Label>
                      <Textarea
                        id="support-message"
                        rows={5}
                        placeholder="Опишите проблему или вопрос подробнее"
                        className="min-h-[140px] resize-y"
                        aria-invalid={!!errors.message}
                        {...register('message')}
                      />
                      {errors.message ? <p className="text-sm text-destructive">{errors.message.message}</p> : null}
                    </div>

                    <Button type="submit" className="w-full sm:w-auto" disabled={mutation.isPending}>
                      {mutation.isPending ? (
                        'Отправка…'
                      ) : (
                        <>
                          <Send className="h-4 w-4" aria-hidden />
                          Отправить
                        </>
                      )}
                    </Button>
                  </form>
                </section>
              </>
            ) : view === 'list' && user ? (
              <section className="col-span-full flex flex-col gap-3 p-5 sm:p-6 md:overflow-y-auto">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Мои обращения</h3>
                {ticketsQuery.isPending ? (
                  <p className="text-sm text-muted-foreground">Загрузка…</p>
                ) : ticketsQuery.isError ? (
                  <p className="text-sm text-destructive">{getRestErrorMessage(ticketsQuery.error)}</p>
                ) : (ticketsQuery.data?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">Пока нет обращений. Создайте новое во вкладке выше.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {ticketsQuery.data?.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          className="flex w-full flex-col gap-1 rounded-lg border border-border bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                          onClick={() => openThread(t.publicId)}
                        >
                          <span className="font-medium text-foreground">{t.topic}</span>
                          <span className="text-xs text-muted-foreground">
                            {supportCategoryLabel(t.category)} · {t.publicId} ·{' '}
                            {t.status === 'OPEN' ? 'Открыто' : 'Закрыто'} · {t.messageCount} сообщ.
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : (
              <section className="col-span-full flex flex-col gap-4 p-5 sm:p-6 md:overflow-y-auto">
                {!threadPublicId && !user ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Введите номер обращения из письма или после отправки формы и email, с которым писали.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="lookup-id">Номер обращения</Label>
                      <Input
                        id="lookup-id"
                        value={lookupId}
                        onChange={(e) => setLookupId(e.target.value.trim())}
                        placeholder="например mabc123-xyz789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lookup-email">Email</Label>
                      <Input
                        id="lookup-email"
                        type="email"
                        value={lookupEmail}
                        onChange={(e) => setLookupEmail(e.target.value.trim())}
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={lookupId.length < 3 || !lookupEmail}
                      onClick={() => setThreadPublicId(lookupId)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Открыть переписку
                    </Button>
                  </>
                ) : threadPublicId ? (
                  <SupportTicketThread
                    publicId={threadPublicId}
                    emailFallback={lookupEmail || user?.email}
                    onBack={() => {
                      setThreadPublicId(null)
                      setView(user ? 'list' : 'new')
                    }}
                  />
                ) : null}
              </section>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
