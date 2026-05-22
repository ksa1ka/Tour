import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useChatChannel } from '@/features/chat/hooks/useChatChannel'
import type { ChatScope } from '@/features/chat/model/types'
import { cn } from '@/shared/lib/utils'
import { ProfileAvatar } from '@/widgets/profile-stats/ui/ProfileAvatar'

function formatChatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

type RealtimeChatProps = {
  scope: ChatScope
  tournamentId?: string
  title: string
  description?: string
  className?: string
}

export function RealtimeChat({ scope, tournamentId, title, description, className }: RealtimeChatProps) {
  const { accessToken, user } = useAuth()
  const { messages, connected, joinError, typingUsers, sendMessage, sendTyping } = useChatChannel({
    accessToken,
    scope,
    tournamentId,
  })
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const stickBottomRef = useRef(true)
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollIfPinned = useCallback(() => {
    const el = listRef.current
    if (!el || !stickBottomRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [])

  useLayoutEffect(() => {
    scrollIfPinned()
  }, [messages, scrollIfPinned])

  const onScroll = () => {
    const el = listRef.current
    if (!el) return
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight
    stickBottomRef.current = gap < 72
  }

  useEffect(() => {
    return () => {
      if (typingIdleRef.current) clearTimeout(typingIdleRef.current)
      sendTyping(false)
    }
  }, [sendTyping])

  const bumpTyping = () => {
    sendTyping(true)
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current)
    typingIdleRef.current = setTimeout(() => {
      typingIdleRef.current = null
      sendTyping(false)
    }, 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    sendMessage(text)
    setDraft('')
    sendTyping(false)
    if (typingIdleRef.current) {
      clearTimeout(typingIdleRef.current)
      typingIdleRef.current = null
    }
    stickBottomRef.current = true
  }

  const displaySelf = user?.email ? user.email.split('@')[0] || user.email : 'Гость'

  return (
    <Card className={cn('glass-panel flex flex-col', className)}>
      <CardHeader className="shrink-0 border-b border-border pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
          </div>
          <span
            className={cn(
              'mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              connected ? 'bg-emerald-500/15 text-emerald-700' : 'bg-muted/70 text-muted-foreground',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-emerald-400' : 'bg-muted-foreground')} />
            {joinError ? 'Ошибка' : connected ? 'Онлайн' : '…'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4 pt-3">
        {joinError ? (
          <p className="text-xs text-destructive">Не удалось подключиться к чату: {joinError}</p>
        ) : null}
        <div
          ref={listRef}
          onScroll={onScroll}
          className="max-h-[min(360px,45vh)] min-h-[200px] flex-1 space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/30 px-3 py-3"
        >
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Пока нет сообщений — напишите первым.</p>
          ) : (
            messages.map((m) => {
              const mine = Boolean(user?.id && m.userId && m.userId === user.id)
              const profileLink = m.userId ? `/users/${m.userId}` : null
              const nameEl = profileLink ? (
                <Link
                  to={profileLink}
                  className={cn(
                    'font-medium hover:underline',
                    mine ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {m.username}
                </Link>
              ) : (
                <span className={cn('font-medium', mine ? 'text-primary' : 'text-foreground')}>{m.username}</span>
              )
              return (
                <div
                  key={m.id}
                  className={cn('flex gap-2', mine ? 'flex-row-reverse' : 'flex-row')}
                >
                  <ProfileAvatar
                    email={`${m.userId ?? m.username}@chat`}
                    displayName={m.username}
                    avatarUrl={m.avatarUrl}
                    size="sm"
                    className="mt-0.5"
                  />
                  <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', mine ? 'items-end' : 'items-start')}>
                    <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
                      {nameEl}
                      <time dateTime={m.createdAt} className="tabular-nums opacity-80">
                        {formatChatTime(m.createdAt)}
                      </time>
                    </div>
                    <p
                      className={cn(
                        'max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                        mine ? 'bg-primary/15 text-foreground' : 'bg-muted/60 text-foreground',
                      )}
                    >
                      {m.text}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {typingUsers.length > 0 ? (
          <p className="text-xs italic text-muted-foreground">
            {typingUsers.length === 1
              ? `${typingUsers[0]} печатает…`
              : `${typingUsers.slice(0, 3).join(', ')}${typingUsers.length > 3 ? ` и ещё ${typingUsers.length - 3}` : ''} печатают…`}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label htmlFor={`chat-input-${scope}-${tournamentId ?? 'g'}`} className="sr-only">
              Сообщение
            </label>
            <textarea
              id={`chat-input-${scope}-${tournamentId ?? 'g'}`}
              rows={2}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                if (e.target.value.trim()) bumpTyping()
              }}
              onBlur={() => {
                sendTyping(false)
                if (typingIdleRef.current) {
                  clearTimeout(typingIdleRef.current)
                  typingIdleRef.current = null
                }
              }}
              placeholder={connected ? `Сообщение как ${displaySelf}…` : 'Подключение…'}
              disabled={!connected}
              className={cn(
                'flex min-h-[44px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
              )}
            />
          </div>
          <Button type="submit" disabled={!connected || !draft.trim()} className="shrink-0 sm:mb-0.5">
            Отправить
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
