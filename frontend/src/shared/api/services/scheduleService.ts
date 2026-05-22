import type { BracketMatchDto } from './matchService'

import { api } from '../client'

export type StandingRowDto = {
  rank: number
  teamId: string
  teamName: string
  played: number
  wins: number
  draws: number
  losses: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
}

export type SwissProgressDto = {
  currentRound: number
  maxRounds: number
  teamCount: number
  allCurrentRoundComplete: boolean
}

export const scheduleService = {
  getStandings(tournamentId: string) {
    return api
      .get<{ standings: StandingRowDto[] }>(`/tournaments/${tournamentId}/standings`)
      .then((r) => r.data.standings)
  },

  getSwissProgress(tournamentId: string) {
    return api
      .get<{ progress: SwissProgressDto }>(`/tournaments/${tournamentId}/swiss/progress`)
      .then((r) => r.data.progress)
  },

  generateRoundRobin(tournamentId: string, teamIds: string[]) {
    return api
      .post<{ matches: BracketMatchDto[] }>(`/tournaments/${tournamentId}/round-robin/generate`, { teamIds })
      .then((r) => r.data.matches)
  },

  generateSwissRound1(tournamentId: string, teamIds?: string[]) {
    return api
      .post<{ matches: BracketMatchDto[] }>(`/tournaments/${tournamentId}/swiss/generate-round`, {
        ...(teamIds && teamIds.length > 0 ? { teamIds } : {}),
      })
      .then((r) => r.data.matches)
  },

  generateSwissNextRound(tournamentId: string) {
    return api
      .post<{ matches: BracketMatchDto[]; progress: SwissProgressDto }>(
        `/tournaments/${tournamentId}/swiss/next-round`,
        {},
      )
      .then((r) => r.data)
  },
}

export const ROUND_ROBIN_MIN_TEAMS = 3
export const ROUND_ROBIN_MAX_TEAMS = 12
