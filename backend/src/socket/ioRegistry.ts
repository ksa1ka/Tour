import type { Server } from 'socket.io'

let io: Server | null = null

export function setIo(server: Server) {
  io = server
}

export function getIo(): Server {
  if (!io) {
    throw new Error('Socket.io is not initialized')
  }
  return io
}

/** Для сидов и фоновых задач без HTTP-сервера. */
export function tryGetIo(): Server | null {
  return io
}
