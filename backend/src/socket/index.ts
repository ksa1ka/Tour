import { randomUUID } from 'node:crypto'
import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'

import { env } from '../config/env.js'
import { prisma } from '../prisma/client.js'
import { verifyAccessToken } from '../utils/jwt.js'
import { appendChatMessage, getChatHistory } from './chatHistory.js'
import {
  type ChatMessagePayload,
  type ChatScope,
  chatDisplayName,
  chatRoomName,
} from './chatTypes.js'
import { setIo } from './ioRegistry.js'
import { emitTournamentPresence, userAccountRoomName } from './tournamentEmit.js'

const MAX_CHAT_LENGTH = 2000

function parseScope(raw: unknown): ChatScope | null {
  if (raw === 'global' || raw === 'tournament') return raw
  return null
}

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:
        env.NODE_ENV === 'development'
          ? true
          : env.clientOrigins.length === 1
            ? env.clientOrigins[0]!
            : env.clientOrigins,
      credentials: true,
    },
  })
  setIo(io)

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) {
      next()
      return
    }
    void (async () => {
      try {
        const payload = verifyAccessToken(token)
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, email: true, displayName: true, avatarUrl: true },
        })
        if (user) {
          socket.data.userId = user.id
          socket.data.email = user.email
          socket.data.displayName = user.displayName
          socket.data.avatarUrl = user.avatarUrl
        }
      } catch {
        // anonymous connections are allowed for public channels
      }
      next()
    })()
  })

  io.on('connection', (socket) => {
    const uid = socket.data.userId as string | undefined
    if (uid) {
      void socket.join(userAccountRoomName(uid))
    }

    socket.on('tournament:join', (payload: { tournamentId?: string }) => {
      const id = payload?.tournamentId
      if (!id) return
      const room = `tournament:${id}`
      void (async () => {
        await Promise.resolve(socket.join(room))
        await emitTournamentPresence(id)
      })()
    })

    socket.on('tournament:leave', (payload: { tournamentId?: string }) => {
      const id = payload?.tournamentId
      if (!id) return
      const room = `tournament:${id}`
      void (async () => {
        await Promise.resolve(socket.leave(room))
        await emitTournamentPresence(id)
      })()
    })

    socket.on('disconnecting', () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id && r.startsWith('tournament:'))
      for (const room of rooms) {
        const tid = room.slice('tournament:'.length)
        void emitTournamentPresence(tid)
      }
    })

    socket.on(
      'chat:join',
      (payload: { scope?: unknown; tournamentId?: unknown }, ack?: (err?: string) => void) => {
        const scope = parseScope(payload?.scope)
        const tournamentId = typeof payload?.tournamentId === 'string' ? payload.tournamentId.trim() : undefined
        if (!scope) {
          ack?.('invalid_scope')
          return
        }
        if (scope === 'tournament' && !tournamentId) {
          ack?.('tournament_required')
          return
        }
        const room = chatRoomName(scope, tournamentId)
        if (!room) {
          ack?.('invalid_room')
          return
        }
        void socket.join(room)
        const history =
          scope === 'global' ? getChatHistory('global') : getChatHistory('tournament', tournamentId as string)
        socket.emit('chat:history', { scope, tournamentId, messages: history })
        ack?.()
      },
    )

    socket.on('chat:leave', (payload: { scope?: unknown; tournamentId?: unknown }) => {
      const scope = parseScope(payload?.scope)
      const tournamentId = typeof payload?.tournamentId === 'string' ? payload.tournamentId.trim() : undefined
      if (!scope) return
      const room = chatRoomName(scope, tournamentId)
      if (!room) return
      void socket.leave(room)
    })

    socket.on(
      'chat:send',
      (payload: { scope?: unknown; tournamentId?: unknown; text?: unknown }, ack?: (err?: string) => void) => {
        const scope = parseScope(payload?.scope)
        const tournamentId = typeof payload?.tournamentId === 'string' ? payload.tournamentId.trim() : undefined
        const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
        if (!scope) {
          ack?.('invalid_scope')
          return
        }
        if (scope === 'tournament' && !tournamentId) {
          ack?.('tournament_required')
          return
        }
        if (!text.length) {
          ack?.('empty')
          return
        }
        if (text.length > MAX_CHAT_LENGTH) {
          ack?.('too_long')
          return
        }
        const room = chatRoomName(scope, tournamentId)
        if (!room) {
          ack?.('invalid_room')
          return
        }

        const email = socket.data.email as string | undefined
        const displayName = socket.data.displayName as string | null | undefined
        const avatarUrl = socket.data.avatarUrl as string | null | undefined
        const msg: ChatMessagePayload = {
          id: randomUUID(),
          scope,
          tournamentId: scope === 'tournament' ? tournamentId : undefined,
          userId: socket.data.userId as string | undefined,
          username: chatDisplayName(email, displayName),
          avatarUrl: avatarUrl ?? null,
          text,
          createdAt: new Date().toISOString(),
        }
        appendChatMessage(msg)
        io.to(room).emit('chat:message', msg)
        ack?.()
      },
    )

    socket.on('chat:typing', (payload: { scope?: unknown; tournamentId?: unknown; typing?: unknown }) => {
      const scope = parseScope(payload?.scope)
      const tournamentId = typeof payload?.tournamentId === 'string' ? payload.tournamentId.trim() : undefined
      const typing = Boolean(payload?.typing)
      if (!scope) return
      if (scope === 'tournament' && !tournamentId) return
      const room = chatRoomName(scope, tournamentId)
      if (!room) return

      const email = socket.data.email as string | undefined
      const displayName = socket.data.displayName as string | null | undefined
      const username = chatDisplayName(email, displayName)
      const out = { scope, tournamentId: scope === 'tournament' ? tournamentId : undefined, username, typing }
      socket.to(room).emit('chat:typing', out)
    })
  })

  return io
}
