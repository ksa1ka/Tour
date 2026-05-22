import { useCallback, useEffect, useState } from 'react'

import type { ChatMessage, ChatScope, ChatTypingEvent } from '@/features/chat/model/types'
import { getSocket } from '@/services/socket'

type UseChatChannelArgs = {
  accessToken: string | null
  scope: ChatScope
  tournamentId?: string
}

export function useChatChannel({ accessToken, scope, tournamentId }: UseChatChannelArgs) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  useEffect(() => {
    const socket = getSocket(accessToken)
    if (!socket) return

    const tid = scope === 'tournament' ? tournamentId : undefined
    if (scope === 'tournament' && !tid) return

    setMessages([])
    setConnected(false)
    setJoinError(null)

    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

    function clearTypingTimer(username: string) {
      const t = typingTimers.get(username)
      if (t) {
        clearTimeout(t)
        typingTimers.delete(username)
      }
    }

    function removeTypingUser(username: string) {
      clearTypingTimer(username)
      setTypingUsers((prev) => prev.filter((u) => u !== username))
    }

    function scheduleTypingExpiry(username: string) {
      clearTypingTimer(username)
      const id = setTimeout(() => {
        typingTimers.delete(username)
        setTypingUsers((prev) => prev.filter((u) => u !== username))
      }, 2800)
      typingTimers.set(username, id)
    }

    const matchesChannel = (payload: { scope: ChatScope; tournamentId?: string }) => {
      if (payload.scope !== scope) return false
      if (scope === 'tournament') return payload.tournamentId === tid
      return true
    }

    const onHistory = (payload: { scope: ChatScope; tournamentId?: string; messages: ChatMessage[] }) => {
      if (!matchesChannel(payload)) return
      setMessages(payload.messages)
    }

    const onMessage = (msg: ChatMessage) => {
      if (!matchesChannel(msg)) return
      setMessages((prev) => [...prev, msg])
    }

    const onTyping = (payload: ChatTypingEvent) => {
      if (!matchesChannel(payload)) return
      if (!payload.typing) {
        removeTypingUser(payload.username)
        return
      }
      setTypingUsers((prev) => (prev.includes(payload.username) ? prev : [...prev, payload.username]))
      scheduleTypingExpiry(payload.username)
    }

    const onConnect = () => {
      socket.emit(
        'chat:join',
        { scope, tournamentId: tid },
        (err: string | undefined) => {
          if (err) {
            setConnected(false)
            setJoinError(err)
            console.warn('[chat] join failed', err)
            return
          }
          setJoinError(null)
          setConnected(true)
        },
      )
    }

    const onDisconnect = () => {
      setConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('chat:history', onHistory)
    socket.on('chat:message', onMessage)
    socket.on('chat:typing', onTyping)

    if (!socket.connected) {
      socket.connect()
    } else {
      onConnect()
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('chat:history', onHistory)
      socket.off('chat:message', onMessage)
      socket.off('chat:typing', onTyping)
      socket.emit('chat:leave', { scope, tournamentId: tid })
      for (const t of typingTimers.values()) clearTimeout(t)
      typingTimers.clear()
      setTypingUsers([])
    }
  }, [accessToken, scope, tournamentId])

  const sendMessage = useCallback(
    (text: string) => {
      const socket = getSocket(accessToken)
      if (!socket?.connected) return
      const tid = scope === 'tournament' ? tournamentId : undefined
      if (scope === 'tournament' && !tid) return
      socket.emit('chat:send', { scope, tournamentId: tid, text }, (err: string | undefined) => {
        if (err) console.warn('[chat] send failed', err)
      })
    },
    [accessToken, scope, tournamentId],
  )

  const sendTyping = useCallback(
    (typing: boolean) => {
      const socket = getSocket(accessToken)
      if (!socket?.connected) return
      const tid = scope === 'tournament' ? tournamentId : undefined
      if (scope === 'tournament' && !tid) return
      socket.emit('chat:typing', { scope, tournamentId: tid, typing })
    },
    [accessToken, scope, tournamentId],
  )

  return { messages, connected, joinError, typingUsers, sendMessage, sendTyping }
}
