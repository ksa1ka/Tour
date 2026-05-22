import type { BracketTeamDto } from '@/shared/api/services/matchService'

export const BRACKET_TEAM = 'BRACKET_TEAM' as const

export type BracketTeamDragItem = {
  type: typeof BRACKET_TEAM
  tournamentId: string
  matchId: string
  round: number
  side: 'A' | 'B'
  team: BracketTeamDto
}
