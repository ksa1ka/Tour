import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { useAuth } from '@/context/AuthContext'
import { getSocket } from '@/services/socket'

export type TournamentPresencePayload = {
  tournamentId: string
  onlineCount: number
  users: { userId: string; email: string | null }[]
}

export type TournamentLiveEventPayload = {
  tournamentId: string
  at: string
  type: string
  message: string
  meta?: Record<string, unknown>
}

/**
 * Joins the tournament Socket.IO room, syncs React Query on bracket/score/events,
 * and exposes presence + last server event for the UI.
 */
export function useTournamentSocketSync(tournamentId: string | null) {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  const [presence, setPresence] = useState<TournamentPresencePayload | null>(null)
  const [lastEvent, setLastEvent] = useState<TournamentLiveEventPayload | null>(null)

  useEffect(() => {
    const socket = getSocket(accessToken)
    if (!socket || !tournamentId) return

    const join = () => {
      socket.emit('tournament:join', { tournamentId })
    }

    const invalidateBracketOnly = () => {
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['team-tournament-history', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['standings', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['swiss-progress', tournamentId] })
    }

    const invalidateFull = () => {
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['team-tournament-history', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['standings', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['swiss-progress', tournamentId] })
    }

    const invalidateFantasy = () => {
      void queryClient.invalidateQueries({ queryKey: ['fantasy-leaderboard', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-me', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-board', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-history', tournamentId] })
      /** FP баланс магазина начисляется при пересчёте fantasy — обновить, если открыт профиль/магазин. */
      void queryClient.invalidateQueries({ queryKey: ['fantasy-shop', 'me'] })
    }

    const onFantasyUpdated = (payload: { tournamentId?: string }) => {
      if (payload?.tournamentId !== tournamentId) return
      invalidateFantasy()
    }

    const onPresence = (payload: TournamentPresencePayload) => {
      if (payload?.tournamentId === tournamentId) {
        setPresence(payload)
      }
    }

    const onServerEvent = (payload: TournamentLiveEventPayload) => {
      if (payload?.tournamentId !== tournamentId) return
      setLastEvent(payload)
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      /** Дублируем инвалидацию сетки, если пришло только tournament:event (например, задержка доставки). Состав игроков — только tournament. */
      const t = payload.type
      if (
        t === 'TEAM_CREATED' ||
        t === 'TEAM_DELETED' ||
        t === 'BRACKET_GENERATED' ||
        t === 'ROUND_ROBIN_GENERATED' ||
        t === 'SWISS_ROUND_GENERATED'
      ) {
        void queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] })
        void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
        void queryClient.invalidateQueries({ queryKey: ['team-tournament-history', tournamentId] })
        void queryClient.invalidateQueries({ queryKey: ['standings', tournamentId] })
        void queryClient.invalidateQueries({ queryKey: ['swiss-progress', tournamentId] })
      }
    }

    if (!socket.connected) {
      socket.connect()
    }
    if (socket.connected) {
      join()
    } else {
      socket.once('connect', join)
    }

    const invalidateMatchesFeed = () => {
      void queryClient.invalidateQueries({ queryKey: ['matches', 'feed'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'matches', 'feed'] })
    }

    const onScoresUpdated = () => {
      invalidateBracketOnly()
      /** Очки fantasy пересчитываются при счёте; без этого UI остаётся старым, если не пришёл fantasy:updated. */
      invalidateFantasy()
      invalidateMatchesFeed()
    }

    const onBracketUpdated = () => {
      invalidateFull()
      invalidateMatchesFeed()
    }

    socket.on('tournament:bracket_updated', onBracketUpdated)
    socket.on('tournament:standings_updated', invalidateBracketOnly)
    socket.on('tournament:scores_updated', onScoresUpdated)
    socket.on('fantasy:updated', onFantasyUpdated)
    socket.on('tournament:presence', onPresence)
    socket.on('tournament:event', onServerEvent)

    return () => {
      socket.off('connect', join)
      socket.off('tournament:bracket_updated', onBracketUpdated)
      socket.off('tournament:standings_updated', invalidateBracketOnly)
      socket.off('tournament:scores_updated', onScoresUpdated)
      socket.off('fantasy:updated', onFantasyUpdated)
      socket.off('tournament:presence', onPresence)
      socket.off('tournament:event', onServerEvent)
      socket.emit('tournament:leave', { tournamentId })
    }
  }, [tournamentId, accessToken, queryClient])

  return { presence, lastEvent }
}
