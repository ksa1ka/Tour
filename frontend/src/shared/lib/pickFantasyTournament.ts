import type { Tournament } from '@/entities/tournament/model/types'

const ROSTER_EDIT_STATUSES = new Set(['DRAFT', 'OPEN', 'REGISTRATION'])

export function isFantasyRosterEditable(status: string): boolean {
  return ROSTER_EDIT_STATUSES.has(status)
}

/** Турнир, в котором по правилам UI ещё можно править fantasy-состав. */
export function pickDefaultFantasyTournamentId(tournaments: Tournament[]): string | null {
  if (!tournaments.length) return null
  const editable = tournaments.find((t) => isFantasyRosterEditable(t.status))
  return editable?.id ?? null
}
