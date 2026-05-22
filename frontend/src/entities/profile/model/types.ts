import type { TournamentFormat, TournamentStatus } from '@/entities/tournament/model/types'

export type ProfileTournamentRole = 'organizer' | 'fantasy'

export type ProfileTournamentHistoryItem = {
  tournamentId: string
  title: string
  status: TournamentStatus
  format: TournamentFormat
  updatedAt: string
  roles: ProfileTournamentRole[]
}

export type ProfileFantasyEntry = {
  fantasyTeamId: string
  name: string | null
  points: number
  picksCount: number
  tournamentId: string
  tournamentTitle: string
  updatedAt: string
}

export type ProfileFantasySummary = {
  fantasyPointsBalance: number
  fantasyTeamCount: number
  tournamentPointsTotal: number
  averagePointsPerTeam: number
  totalPicks: number
  bestScore: number | null
}

export type UserProfile = {
  id: string
  email: string
  role: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  memberSince: string
  tournamentHistory: ProfileTournamentHistoryItem[]
  fantasy: {
    summary: ProfileFantasySummary
    entries: ProfileFantasyEntry[]
  }
}

/** Профиль другого пользователя (без email). */
export type PublicUserProfile = Omit<UserProfile, 'email'>
