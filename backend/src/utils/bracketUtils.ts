/** Поддерживаемые размеры сетки на выбывание (степень двойки). */
export const SINGLE_ELIMINATION_TEAM_COUNTS = [4, 8, 16, 32] as const

export type SingleEliminationTeamCount = (typeof SINGLE_ELIMINATION_TEAM_COUNTS)[number]

export function isSingleEliminationTeamCount(n: number): n is SingleEliminationTeamCount {
  return (SINGLE_ELIMINATION_TEAM_COUNTS as readonly number[]).includes(n)
}

export function assertSingleEliminationTeamCount(n: number): asserts n is SingleEliminationTeamCount {
  if (!isSingleEliminationTeamCount(n)) {
    throw new Error(
      `Bracket size must be one of ${SINGLE_ELIMINATION_TEAM_COUNTS.join(', ')} teams, got ${n}`,
    )
  }
}

/** Число раундов (раунд 1 — первый с максимальным числом матчей). */
export function singleEliminationRoundCount(teamCount: SingleEliminationTeamCount): number {
  return Math.log2(teamCount)
}

/** Число матчей в указанном раунде (1 = первый раунд). */
export function matchesInRound(teamCount: SingleEliminationTeamCount, round: number): number {
  const total = singleEliminationRoundCount(teamCount)
  if (round < 1 || round > total) {
    throw new Error(`Round ${round} out of range 1..${total}`)
  }
  return 1 << (total - round)
}

/** Раунд и позиция матча, в который выходит победитель матча (round, position). */
export function nextMatchCoords(round: number, position: number): { round: number; position: number } {
  return { round: round + 1, position: Math.ceil(position / 2) }
}

/**
 * Слот в следующем матче: нечётная позиция в паре → teamA, чётная → teamB.
 */
export function feederSlotKey(position: number): 'teamAId' | 'teamBId' {
  return position % 2 === 1 ? 'teamAId' : 'teamBId'
}
