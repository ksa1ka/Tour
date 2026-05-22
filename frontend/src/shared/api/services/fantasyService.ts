import type { FantasyPredictionType } from '@/entities/tournament/model/types'
import type { Team } from '@/entities/team/model/types'

import { api } from '../client'

export type { FantasyPredictionType }

export type FantasyTeamUserDto = {
  id: string
  email: string
  displayName: string | null
}

export type FantasyTeamNestedTournamentDto = {
  id: string
  title: string
}

export type FantasyTeamNestedTeamDto = Team

export type FantasyTeamSelectionNestedDto = {
  id: string
  teamId: string
  team: FantasyTeamNestedTeamDto
}

export type FantasyTeamDto = {
  id: string
  userId: string
  tournamentId: string
  name: string | null
  points: number
  rosterPoints?: number
  fantasyPredictionPoints?: number
  fantasyBonusPoints?: number
  createdAt: string
  updatedAt: string
  tournament: FantasyTeamNestedTournamentDto
  selections: FantasyTeamSelectionNestedDto[]
}

export type FantasyLeaderboardEntryDto = {
  rank: number
  id: string
  points: number
  rosterPoints: number
  fantasyPredictionPoints: number
  fantasyBonusPoints: number
  name: string | null
  createdAt: string
  user: FantasyTeamUserDto
  selections: { team: Team }[]
}

export type FantasyMeDto = {
  id: string
  points: number
  rosterPoints: number
  fantasyPredictionPoints: number
  fantasyBonusPoints: number
  mvpCorrectCount: number
  mvpBadgeTier: 'bronze' | 'silver' | 'gold' | null
  name: string | null
  rank: number
  createdAt: string
  user: FantasyTeamUserDto
  selections: { team: Team }[]
} | null

export type FantasyMyPredictionDto = {
  matchId: string
  predictedWinnerTeamId: string | null
  predictedMvpPlayerId: string | null
  predictedFirstKillPlayerId: string | null
  predictedHighestScoreTeamId: string | null
  predictedScoreA: number | null
  predictedScoreB: number | null
  ptsWinner: number
  ptsMvp: number
  ptsFirstKill: number
  ptsHighestScore: number
  ptsExactScore: number
  bonusPts: number
}

export type FantasyBoardMatchDto = {
  id: string
  round: number
  position: number
  teamAId: string | null
  teamBId: string | null
  scoreA: number | null
  scoreB: number | null
  winnerId: string | null
  mvpPlayerId: string | null
  firstKillPlayerId: string | null
  teamA: Team | null
  teamB: Team | null
  predictable: boolean
  myPrediction: FantasyMyPredictionDto | null
}

export type FantasyPredictionBoardDto = {
  activePredictionTypes: FantasyPredictionType[]
  matches: FantasyBoardMatchDto[]
}

export type FantasyPredictionHistoryEntryDto = {
  id: string
  updatedAt: string
  predictedWinnerTeamId: string | null
  predictedMvpPlayerId: string | null
  predictedFirstKillPlayerId: string | null
  predictedHighestScoreTeamId: string | null
  predictedScoreA: number | null
  predictedScoreB: number | null
  ptsWinner: number
  ptsMvp: number
  ptsFirstKill: number
  ptsHighestScore: number
  ptsExactScore: number
  bonusPts: number
  match: {
    id: string
    round: number
    position: number
    scoreA: number | null
    scoreB: number | null
    winnerId: string | null
    mvpPlayerId: string | null
    firstKillPlayerId: string | null
    teamA: { id: string; name: string }
    teamB: { id: string; name: string }
  }
}

export type FantasyPredictionStatsDto = {
  mvpCorrect: number
  totalPredictionRows: number
  totalPointsFromPredictions: number
  totalBonus: number
  byKind: Record<
    FantasyPredictionType,
    { correct: number; total: number; points: number }
  >
}

export type UpsertFantasyMatchPredictionPayload = {
  predictedWinnerTeamId?: string | null
  predictedMvpPlayerId?: string | null
  predictedFirstKillPlayerId?: string | null
  predictedHighestScoreTeamId?: string | null
  predictedScoreA?: number | null
  predictedScoreB?: number | null
}

export type FantasyTournamentTeamStatsDto = {
  id: string
  name: string
  logo: string | null
  wins: number
  pointsFromWins: number
}

export const fantasyService = {
  listMyTeams() {
    return api.get<{ fantasyTeams: FantasyTeamDto[] }>('/fantasy/teams').then((r) => r.data.fantasyTeams)
  },

  createTeam(payload: { tournamentId: string; name?: string | null }) {
    return api.post<{ fantasyTeam: FantasyTeamDto }>('/fantasy/teams', payload).then((r) => r.data.fantasyTeam)
  },

  replaceSelections(fantasyTeamId: string, teamIds: string[]) {
    return api
      .put<{ fantasyTeam: FantasyTeamDto }>(`/fantasy/teams/${fantasyTeamId}/selections`, { teamIds })
      .then((r) => r.data.fantasyTeam)
  },

  getTournamentLeaderboard(tournamentId: string, params?: { limit?: number; offset?: number }) {
    return api
      .get<{
        leaderboard: FantasyLeaderboardEntryDto[]
        total: number
        limit: number
        offset: number
      }>(`/tournaments/${tournamentId}/fantasy/leaderboard`, { params })
      .then((r) => r.data)
  },

  getTournamentFantasyMe(tournamentId: string) {
    return api.get<{ fantasyTeam: FantasyMeDto }>(`/tournaments/${tournamentId}/fantasy/me`).then((r) => r.data.fantasyTeam)
  },

  putTournamentFantasyTeam(tournamentId: string, body: { name?: string | null; teamIds: string[] }) {
    return api
      .put<{ fantasyTeam: FantasyMeDto }>(`/tournaments/${tournamentId}/fantasy/team`, body)
      .then((r) => r.data.fantasyTeam)
  },

  getTournamentFantasyStats(tournamentId: string) {
    return api.get<{ teams: FantasyTournamentTeamStatsDto[] }>(`/tournaments/${tournamentId}/fantasy/stats`).then((r) => r.data.teams)
  },

  recalculateTournamentFantasy(tournamentId: string) {
    return api.post<{ ok: boolean }>(`/tournaments/${tournamentId}/fantasy/recalculate`).then((r) => r.data)
  },

  getPredictionBoard(tournamentId: string) {
    return api
      .get<FantasyPredictionBoardDto>(`/tournaments/${tournamentId}/fantasy/predictions/board`)
      .then((r) => r.data)
  },

  putMatchPrediction(tournamentId: string, matchId: string, body: UpsertFantasyMatchPredictionPayload) {
    return api.put<{ ok: boolean }>(`/tournaments/${tournamentId}/fantasy/predictions/matches/${matchId}`, body).then((r) => r.data)
  },

  getPredictionHistory(tournamentId: string) {
    return api
      .get<{ entries: FantasyPredictionHistoryEntryDto[] }>(`/tournaments/${tournamentId}/fantasy/predictions/history`)
      .then((r) => r.data.entries)
  },

  getPredictionStats(tournamentId: string) {
    return api
      .get<FantasyPredictionStatsDto>(`/tournaments/${tournamentId}/fantasy/predictions/stats`)
      .then((r) => r.data)
  },
}
