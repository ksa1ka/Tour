export const ROUND_ROBIN_MIN_TEAMS = 3
export const ROUND_ROBIN_MAX_TEAMS = 12

export type RoundRobinPair = {
  round: number
  position: number
  teamAIndex: number
  teamBIndex: number
}

/**
 * Круговой метод (Berger): каждая команда встречается с каждой ровно один раз.
 * `teamIds.length` — число реальных команд (3–12).
 */
export function buildRoundRobinSchedule(teamCount: number): RoundRobinPair[] {
  if (teamCount < ROUND_ROBIN_MIN_TEAMS || teamCount > ROUND_ROBIN_MAX_TEAMS) {
    throw new Error(`Round-robin requires ${ROUND_ROBIN_MIN_TEAMS}–${ROUND_ROBIN_MAX_TEAMS} teams`)
  }

  const n = teamCount % 2 === 0 ? teamCount : teamCount + 1
  const rounds = n - 1
  const indices = Array.from({ length: n }, (_, i) => i)
  const pairs: RoundRobinPair[] = []
  let positionInRound = 1
  let currentRound = 1

  for (let r = 0; r < rounds; r++) {
    positionInRound = 1
    for (let i = 0; i < n / 2; i++) {
      const a = indices[i]!
      const b = indices[n - 1 - i]!
      if (a < teamCount && b < teamCount) {
        pairs.push({
          round: currentRound,
          position: positionInRound,
          teamAIndex: a,
          teamBIndex: b,
        })
        positionInRound++
      }
    }
    currentRound++
    const fixed = indices[0]!
    const rest = indices.slice(1)
    const last = rest.pop()!
    indices.length = 0
    indices.push(fixed, last, ...rest)
  }

  return pairs
}

export function roundRobinMatchCount(teamCount: number): number {
  return (teamCount * (teamCount - 1)) / 2
}
