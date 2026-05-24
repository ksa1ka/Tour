export type TournamentStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'REGISTRATION'
  | 'CLOSED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

/** Значения enum `TournamentGame` в API и БД (синхронизировать с Prisma). */
export const TOURNAMENT_GAMES = [
  'VALORANT',
  'CS2',
  'DOTA2',
  'LEAGUE_OF_LEGENDS',
  'DEADLOCK',
  'WORLD_OF_TANKS',
] as const

export type TournamentGame = (typeof TOURNAMENT_GAMES)[number]

/** Форматы, доступные при создании через API. */
export const CREATABLE_TOURNAMENT_FORMATS = ['SINGLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS'] as const
export type CreatableTournamentFormat = (typeof CREATABLE_TOURNAMENT_FORMATS)[number]

export type TournamentFormat =
  | CreatableTournamentFormat
  | 'DOUBLE_ELIMINATION'
  | 'GROUP_STAGE'

export type TournamentFormatConfig = {
  pointsWin?: number
  pointsDraw?: number
  pointsLoss?: number
  swissRounds?: number
}

export type TournamentCreator = {
  id: string
  email: string
  role: 'ADMIN' | 'VIEWER' | 'PLAYER'
}

export type FantasyPredictionType = 'WINNER' | 'MVP' | 'FIRST_KILL' | 'HIGHEST_SCORE' | 'EXACT_SCORE'

import type { Team } from '@/entities/team/model/types'

export type Tournament = {
  id: string
  title: string
  description: string | null
  avatarUrl: string | null
  game: TournamentGame
  format: TournamentFormat
  status: TournamentStatus
  fantasyActivePredictions?: FantasyPredictionType[] | null
  formatConfig?: TournamentFormatConfig | null
  createdAt: string
  updatedAt: string
  creator: TournamentCreator
}

export type TournamentDetail = Tournament & {
  _count: {
    teams: number
    matches: number
  }
  /** Команда текущего пользователя-капитана на этом турнире (null — нет заявки). */
  myTeam: Team | null
  /** Полные карточки команд с составом (как в GET /teams?…). */
  teams: Team[]
}
