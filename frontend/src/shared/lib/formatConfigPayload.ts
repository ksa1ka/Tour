import type { TournamentFormatConfig } from '@/entities/tournament/model/types'
import type { TournamentFormValues } from '@/features/tournament-form/model/tournamentFormSchema'

export function formatConfigFromForm(values: TournamentFormValues): TournamentFormatConfig | undefined {
  if (values.format !== 'SWISS') return undefined
  const raw = values.swissRounds?.trim()
  if (!raw) return undefined
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 3 || n > 12) return undefined
  return { swissRounds: n }
}
