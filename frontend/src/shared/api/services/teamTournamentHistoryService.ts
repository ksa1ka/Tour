import { api } from '../client'

import type { BracketTeamDto } from './matchService'

export type TeamHistoryOutcome = 'win' | 'loss' | 'pending' | 'awaiting_opponent'

export type TeamTournamentHistoryStepDto = {
  matchId: string
  round: number
  position: number
  opponent: BracketTeamDto | null
  scoreOur: number | null
  scoreTheir: number | null
  outcome: TeamHistoryOutcome
}

export type TeamTournamentHistoryDto = {
  team: BracketTeamDto
  tournamentId: string
  bracketTotalRounds: number
  steps: TeamTournamentHistoryStepDto[]
}

export const teamTournamentHistoryService = {
  getByTeam(tournamentId: string, teamId: string) {
    return api
      .get<TeamTournamentHistoryDto>(`/tournaments/${tournamentId}/teams/${teamId}/history`)
      .then((r) => r.data)
  },
}
