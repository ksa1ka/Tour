import type { Player } from '@/entities/team/model/types'

import { api } from '../client'

export type BracketTeamDto = {
  id: string
  name: string
  logo: string | null
  /** Состав в слоте сетки (с бэкенда всегда массив; пустой, если игроков нет). */
  players: Player[]
}

export type BracketMatchDto = {
  id: string
  tournamentId: string
  round: number
  position: number
  teamAId: string | null
  teamBId: string | null
  scoreA: number | null
  scoreB: number | null
  winnerId: string | null
  mvpPlayerId: string | null
  firstKillPlayerId: string | null
  nextMatchId: string | null
  teamA: BracketTeamDto | null
  teamB: BracketTeamDto | null
  winner: BracketTeamDto | null
  mvpPlayer: Player | null
  firstKillPlayer: Player | null
  nextMatch: { id: string; round: number; position: number } | null
}

export type BracketMatchWithTournamentDto = BracketMatchDto & {
  tournament: {
    id: string
    title: string
    status: string
    avatarUrl: string | null
    format?: string
  }
}

export type UpdateMatchResultPayload =
  | { mode: 'set'; scoreA: number; scoreB: number; mvpPlayerId?: string | null; firstKillPlayerId?: string | null }
  | { mode: 'clear' }

export type SetBracketWinnerPayload = {
  winnerId: string
  scoreA?: number | null
  scoreB?: number | null
  mvpPlayerId?: string | null
  firstKillPlayerId?: string | null
}

export type SwapBracketTeamSlotsPayload = {
  fromMatchId: string
  fromSide: 'A' | 'B'
  toMatchId: string
  toSide: 'A' | 'B'
}

export const BRACKET_TEAM_COUNTS = [4, 8, 16, 32] as const

export function isBracketTeamCount(n: number): n is (typeof BRACKET_TEAM_COUNTS)[number] {
  return (BRACKET_TEAM_COUNTS as readonly number[]).includes(n)
}

export const matchService = {
  listAllFeed() {
    return api.get<{ matches: BracketMatchWithTournamentDto[] }>('/matches/feed').then((r) => r.data.matches)
  },

  listByTournament(tournamentId: string) {
    return api
      .get<{ matches: BracketMatchDto[] }>(`/tournaments/${tournamentId}/matches`)
      .then((r) => r.data.matches)
  },

  updateResult(tournamentId: string, matchId: string, payload: UpdateMatchResultPayload) {
    return api
      .patch<{ match: BracketMatchDto }>(`/tournaments/${tournamentId}/matches/${matchId}`, payload)
      .then((r) => r.data.match)
  },

  generateBracket(tournamentId: string, teamIds: string[]) {
    return api
      .post<{ matches: BracketMatchDto[] }>(`/tournaments/${tournamentId}/bracket/generate`, { teamIds })
      .then((r) => r.data.matches)
  },

  setBracketWinner(tournamentId: string, matchId: string, payload: SetBracketWinnerPayload) {
    return api
      .patch<{ match: BracketMatchDto }>(`/tournaments/${tournamentId}/bracket/matches/${matchId}`, payload)
      .then((r) => r.data.match)
  },

  swapBracketTeamSlots(tournamentId: string, payload: SwapBracketTeamSlotsPayload) {
    return api
      .patch<{ matches: BracketMatchDto[] }>(`/tournaments/${tournamentId}/bracket/team-slots/swap`, payload)
      .then((r) => r.data.matches)
  },
}
