import { matchPairKey } from './matchPairKey.js'

export type SwissStandingRow = {
  teamId: string
  points: number
  goalDiff: number
  goalsFor: number
}

/**
 * Жадное спаривание внутри корзин с одинаковыми очками; без повторных встреч.
 * `orderedTeamIds` — уже отсортированы по очкам и тай-брейкам (сильнейшие первые).
 * Возвращает пары [teamA, teamB?]; нечётное N → последняя команда без пары (bye).
 */
export function pairSwissRound(
  orderedTeamIds: string[],
  playedPairs: Set<string>,
): Array<{ teamAId: string; teamBId: string | null }> {
  const unpaired = [...orderedTeamIds]
  const pairs: Array<{ teamAId: string; teamBId: string | null }> = []

  while (unpaired.length > 0) {
    const teamA = unpaired.shift()!
    let partnerIndex = -1

    for (let i = 0; i < unpaired.length; i++) {
      const candidate = unpaired[i]!
      const key = matchPairKey(teamA, candidate)
      if (!playedPairs.has(key)) {
        partnerIndex = i
        break
      }
    }

    if (partnerIndex === -1) {
      if (unpaired.length === 0) {
        pairs.push({ teamAId: teamA, teamBId: null })
        break
      }
      throw new Error('SWISS_PAIRING_EXHAUSTED')
    }

    const teamB = unpaired.splice(partnerIndex, 1)[0]!
    pairs.push({ teamAId: teamA, teamBId: teamB })
  }

  return pairs
}

/** Fisher–Yates shuffle (копия массива). */
export function shuffleTeamIds(teamIds: string[]): string[] {
  const arr = [...teamIds]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export function sortTeamsForSwissPairing(rows: SwissStandingRow[]): string[] {
  return [...rows]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      return b.goalsFor - a.goalsFor
    })
    .map((r) => r.teamId)
}
