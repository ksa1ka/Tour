import { io, type Socket } from 'socket.io-client'

import { socketOrigin } from '@/config/publicEnv'

let socket: Socket | null = null
/** Токен, с которым сокет уже прошёл handshake на сервере. */
let boundToken: string | null | undefined = undefined

function authPayload(token: string | null) {
  return token ? { token } : {}
}

function createSocket(token: string | null): Socket {
  return io(socketOrigin || undefined, {
    path: '/socket.io',
    autoConnect: false,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: authPayload(token),
  })
}

function applyAuth(sock: Socket, token: string | null) {
  sock.auth = authPayload(token)
}

/**
 * Сервер читает JWT только при подключении (io.use). Смена `socket.auth` без reconnect
 * оставляет старый userId — сообщения уходят от предыдущего аккаунта.
 */
function reconnectWithNewToken(sock: Socket, token: string | null) {
  applyAuth(sock, token)
  if (sock.connected) {
    sock.disconnect()
    sock.connect()
  }
}

export function getSocket(token?: string | null) {
  if (typeof window === 'undefined') return null

  const nextToken = token ?? null

  if (!socket) {
    socket = createSocket(nextToken)
    boundToken = nextToken
    return socket
  }

  if (boundToken !== nextToken) {
    boundToken = nextToken
    reconnectWithNewToken(socket, nextToken)
  }

  return socket
}

export function disconnectSocket() {
  if (!socket) return
  if (socket.connected) {
    socket.disconnect()
  }
  socket = null
  boundToken = undefined
}
