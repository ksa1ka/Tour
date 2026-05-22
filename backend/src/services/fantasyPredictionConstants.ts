export const FANTASY_PREDICTION_TYPES = [
  'WINNER',
  'MVP',
  'FIRST_KILL',
  'HIGHEST_SCORE',
  'EXACT_SCORE',
] as const

export type FantasyPredictionType = (typeof FANTASY_PREDICTION_TYPES)[number]

export const DEFAULT_FANTASY_PREDICTION_TYPES: FantasyPredictionType[] = [...FANTASY_PREDICTION_TYPES]

export const POINTS_WINNER = 15
export const POINTS_MVP = 20
export const POINTS_FIRST_KILL = 12
export const POINTS_HIGHEST_SCORE = 10
export const POINTS_EXACT_SCORE = 25

/** Бонус, если все оцениваемые категории (есть фактический результат) угаданы и их ≥ 3. */
export const BONUS_PERFECT_GRADABLE = 30
/** Бонус за 4+ верных из тех категорий, по которым выставлен факт (без полного свипа). */
export const BONUS_FOUR_CORRECT = 12
