import type { TournamentFormat, TournamentGame, TournamentStatus } from '@/entities/tournament/model/types'

const statusRu: Record<TournamentStatus, string> = {
  DRAFT: 'Черновик',
  OPEN: 'Открыт',
  REGISTRATION: 'Регистрация',
  CLOSED: 'Закрыт',
  IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
}

const gameRu: Record<TournamentGame, string> = {
  VALORANT: 'Валорант',
  CS2: 'Counter-Strike 2',
  DOTA2: 'Dota 2',
  LEAGUE_OF_LEGENDS: 'League of Legends',
  DEADLOCK: 'Deadlock',
  WORLD_OF_TANKS: 'Мир танков',
}

const formatRu: Record<TournamentFormat, string> = {
  SINGLE_ELIMINATION: 'На выбывание',
  DOUBLE_ELIMINATION: 'Двойное выбывание',
  ROUND_ROBIN: 'Круговая система',
  SWISS: 'Швейцарская',
  GROUP_STAGE: 'Групповой этап',
}

export function tournamentStatusLabel(s: TournamentStatus): string {
  return statusRu[s] ?? s
}

export function tournamentFormatLabel(f: TournamentFormat): string {
  return formatRu[f] ?? f
}

export function tournamentGameLabel(g: TournamentGame): string {
  return gameRu[g] ?? g
}
