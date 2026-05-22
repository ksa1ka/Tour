import type { TournamentStatus } from '@/entities/tournament/model/types'

/** Подсказка на странице сборки состава фэнтези. */
export function fantasyRosterEditableHint(): string {
  return 'Пока турнир ещё не начался, вы можете выбрать команды и менять порядок. После старта состав фиксируется.'
}

/** Сообщение, когда состав фэнтези нельзя редактировать. */
export function fantasyRosterLockedMessage(status: TournamentStatus): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'Турнир уже идёт — собрать или изменить состав больше нельзя. Доступны прогнозы по матчам и таблица очков.'
    case 'COMPLETED':
      return 'Турнир завершён — состав зафиксирован, редактирование недоступно.'
    case 'CANCELLED':
      return 'Турнир отменён — состав не редактируется.'
    case 'CLOSED':
      return 'Приём составов закрыт — изменения больше недоступны.'
    default:
      return 'Редактирование состава сейчас недоступно.'
  }
}

const predictionTypeRu: Record<string, string> = {
  WINNER: 'Победитель матча',
  MVP: 'Лучший игрок',
  FIRST_KILL: 'Первый фраг',
  HIGHEST_SCORE: 'Наибольший счёт',
  EXACT_SCORE: 'Точный счёт',
}

export function fantasyPredictionTypeLabel(kind: string): string {
  return predictionTypeRu[kind] ?? kind
}

export function fantasyPredictionTypesLine(types: string[]): string {
  return types.map(fantasyPredictionTypeLabel).join(' · ')
}

const mvpBadgeRu: Record<string, string> = {
  gold: 'Золотой значок',
  silver: 'Серебряный значок',
  bronze: 'Бронзовый значок',
}

export function mvpBadgeTierLabel(tier: string): string {
  return mvpBadgeRu[tier] ?? tier
}

/** Очки фэнтези (вместо FP / pts в интерфейсе). */
export const FANTASY_POINTS_SHORT = 'очков'

export function formatFantasyPoints(n: number): string {
  return `${n.toLocaleString('ru-RU')} ${FANTASY_POINTS_SHORT}`
}
