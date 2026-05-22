/** Канонический ключ пары команд (без учёта порядка A/B). */
export function matchPairKey(teamAId: string, teamBId: string): string {
  return teamAId < teamBId ? `${teamAId}:${teamBId}` : `${teamBId}:${teamAId}`
}
