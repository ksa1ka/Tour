import { getIo, tryGetIo } from './ioRegistry.js'

export function tournamentRoomName(tournamentId: string) {
  return `tournament:${tournamentId}`
}

/** Персональная комната для push-уведомлений аккаунта (баланс FP, синхронизация без открытой страницы турнира). */
export function userAccountRoomName(userId: string) {
  return `user:${userId}`
}

export async function emitTournamentPresence(tournamentId: string) {
  const io = getIo()
  const room = tournamentRoomName(tournamentId)
  const sockets = await io.in(room).fetchSockets()
  const users = sockets
    .map((s) => {
      const userId = s.data.userId as string | undefined
      const email = s.data.email as string | undefined
      if (!userId) return null
      return { userId, email: email ?? null }
    })
    .filter((u): u is { userId: string; email: string | null } => u !== null)

  io.to(room).emit('tournament:presence', {
    tournamentId,
    onlineCount: sockets.length,
    users,
  })
}

export function emitTournamentBracketUpdated(tournamentId: string) {
  getIo().to(tournamentRoomName(tournamentId)).emit('tournament:bracket_updated', { tournamentId })
}

export function emitTournamentScoresUpdated(tournamentId: string, matchId: string) {
  getIo()
    .to(tournamentRoomName(tournamentId))
    .emit('tournament:scores_updated', { tournamentId, matchId })
}

export function emitTournamentStandingsUpdated(tournamentId: string) {
  getIo()
    .to(tournamentRoomName(tournamentId))
    .emit('tournament:standings_updated', { tournamentId })
}

export function emitFantasyUpdated(
  tournamentId: string,
  opts?: { matchId?: string; notifyUserIds?: string[] },
) {
  const io = tryGetIo()
  if (!io) return
  const { matchId, notifyUserIds } = opts ?? {}
  const body = {
    tournamentId,
    at: new Date().toISOString(),
    ...(matchId !== undefined ? { matchId } : {}),
  }
  io.to(tournamentRoomName(tournamentId)).emit('fantasy:updated', body)
  for (const uid of notifyUserIds ?? []) {
    if (!uid) continue
    io.to(userAccountRoomName(uid)).emit('fantasy:updated', body)
  }
}

export function emitTournamentEvent(
  tournamentId: string,
  payload: { type: string; message: string; meta?: Record<string, unknown> },
) {
  getIo()
    .to(tournamentRoomName(tournamentId))
    .emit('tournament:event', {
      tournamentId,
      at: new Date().toISOString(),
      ...payload,
    })
}
