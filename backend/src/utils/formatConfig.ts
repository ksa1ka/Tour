import type { JsonValue } from '@prisma/client/runtime/library'

export type TournamentFormatConfig = {
  pointsWin?: number
  pointsDraw?: number
  pointsLoss?: number
  swissRounds?: number
}

export const DEFAULT_FORMAT_CONFIG: Required<Pick<TournamentFormatConfig, 'pointsWin' | 'pointsDraw' | 'pointsLoss'>> = {
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
}

export function parseFormatConfig(raw: JsonValue | null | undefined): TournamentFormatConfig {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const o = raw as Record<string, unknown>
  const out: TournamentFormatConfig = {}
  if (typeof o.pointsWin === 'number' && Number.isInteger(o.pointsWin)) out.pointsWin = o.pointsWin
  if (typeof o.pointsDraw === 'number' && Number.isInteger(o.pointsDraw)) out.pointsDraw = o.pointsDraw
  if (typeof o.pointsLoss === 'number' && Number.isInteger(o.pointsLoss)) out.pointsLoss = o.pointsLoss
  if (typeof o.swissRounds === 'number' && Number.isInteger(o.swissRounds)) out.swissRounds = o.swissRounds
  return out
}

export function resolvedPointsConfig(raw: JsonValue | null | undefined) {
  const parsed = parseFormatConfig(raw)
  return {
    pointsWin: parsed.pointsWin ?? DEFAULT_FORMAT_CONFIG.pointsWin,
    pointsDraw: parsed.pointsDraw ?? DEFAULT_FORMAT_CONFIG.pointsDraw,
    pointsLoss: parsed.pointsLoss ?? DEFAULT_FORMAT_CONFIG.pointsLoss,
    swissRounds: parsed.swissRounds,
  }
}

/** Число туров швейцарки: из config или ceil(log2(N)). */
export function defaultSwissRounds(teamCount: number, configSwissRounds?: number): number {
  if (configSwissRounds != null && configSwissRounds >= 3) return configSwissRounds
  return Math.max(3, Math.ceil(Math.log2(Math.max(2, teamCount))))
}
