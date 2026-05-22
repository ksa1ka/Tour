/** Подпись колонки раунда для single elimination (round 1 — самый «широкий»). */
export function bracketRoundTitle(round: number, totalRounds: number): string {
  const matchesInRound = 2 ** (totalRounds - round)
  if (matchesInRound <= 1) return 'Финал'
  if (matchesInRound === 2) return 'Полуфинал'
  if (matchesInRound === 4) return 'Четвертьфинал'
  if (matchesInRound === 8) return '1/8 финала'
  if (matchesInRound === 16) return '1/16 финала'
  return `Раунд ${round}`
}

/** Стадия матча с учётом формата турнира (лента, история). */
export function matchStageLabel(
  format: string | undefined,
  round: number,
  totalRounds: number,
): string {
  if (format === 'ROUND_ROBIN' || format === 'SWISS') {
    return `Тур ${round}`
  }
  return bracketRoundTitle(round, totalRounds)
}
