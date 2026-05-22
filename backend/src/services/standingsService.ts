import { TournamentFormat } from '@prisma/client'

import { HttpError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import { matchPairKey } from '../utils/matchPairKey.js'
import { resolvedPointsConfig } from '../utils/formatConfig.js'

export type StandingRow = {
  rank: number
  teamId: string
  teamName: string
  played: number
  wins: number
  draws: number
  losses: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
}

type MatchRow = {
  teamAId: string | null
  teamBId: string | null
  scoreA: number | null
  scoreB: number | null
  winnerId: string | null
}

function isMatchPlayed(m: MatchRow): boolean {
  return m.scoreA != null && m.scoreB != null && m.teamAId != null && m.teamBId != null
}

function initStats(teamIds: string[], names: Map<string, string>) {
  const map = new Map<string, Omit<StandingRow, 'rank' | 'teamName'>>()
  for (const id of teamIds) {
    map.set(id, {
      teamId: id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
    })
  }
  return { map, names }
}

function applyMatchResult(
  stats: Map<string, Omit<StandingRow, 'rank' | 'teamName'>>,
  m: MatchRow,
  pointsWin: number,
  pointsDraw: number,
  pointsLoss: number,
) {
  const a = m.teamAId!
  const b = m.teamBId!
  const sa = m.scoreA!
  const sb = m.scoreB!
  const stA = stats.get(a)!
  const stB = stats.get(b)!

  stA.played++
  stB.played++
  stA.goalsFor += sa
  stA.goalsAgainst += sb
  stB.goalsFor += sb
  stB.goalsAgainst += sa
  stA.goalDiff = stA.goalsFor - stA.goalsAgainst
  stB.goalDiff = stB.goalsFor - stB.goalsAgainst

  if (sa > sb) {
    stA.wins++
    stB.losses++
    stA.points += pointsWin
    stB.points += pointsLoss
  } else if (sb > sa) {
    stB.wins++
    stA.losses++
    stB.points += pointsWin
    stA.points += pointsLoss
  } else {
    stA.draws++
    stB.draws++
    stA.points += pointsDraw
    stB.points += pointsDraw
  }
}

function headToHeadPoints(
  teamA: string,
  teamB: string,
  matches: MatchRow[],
  pointsWin: number,
  pointsDraw: number,
): { a: number; b: number } {
  let a = 0
  let b = 0
  for (const m of matches) {
    if (!isMatchPlayed(m)) continue
    const ids = [m.teamAId, m.teamBId]
    if (!ids.includes(teamA) || !ids.includes(teamB)) continue
    const sa = m.scoreA!
    const sb = m.scoreB!
    const aIsFirst = m.teamAId === teamA
    const scoreA = aIsFirst ? sa : sb
    const scoreB = aIsFirst ? sb : sa
    if (scoreA > scoreB) a += pointsWin
    else if (scoreB > scoreA) b += pointsWin
    else {
      a += pointsDraw
      b += pointsDraw
    }
  }
  return { a, b }
}

function compareStandings(
  a: Omit<StandingRow, 'rank' | 'teamName'>,
  b: Omit<StandingRow, 'rank' | 'teamName'>,
  matches: MatchRow[],
  pointsWin: number,
  pointsDraw: number,
): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
  const h2h = headToHeadPoints(a.teamId, b.teamId, matches, pointsWin, pointsDraw)
  if (h2h.b !== h2h.a) return h2h.b - h2h.a
  return a.teamId.localeCompare(b.teamId)
}

export async function getStandings(tournamentId: string): Promise<StandingRow[]> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      format: true,
      formatConfig: true,
      teams: { select: { id: true, name: true } },
      matches: {
        select: {
          teamAId: true,
          teamBId: true,
          scoreA: true,
          scoreB: true,
          winnerId: true,
        },
      },
    },
  })

  if (!tournament) {
    throw new HttpError(404, 'Tournament not found')
  }

  const fmt = tournament.format
  if (
    fmt !== TournamentFormat.ROUND_ROBIN &&
    fmt !== TournamentFormat.SWISS &&
    fmt !== TournamentFormat.SINGLE_ELIMINATION
  ) {
    throw new HttpError(400, 'Standings are not available for this tournament format')
  }

  const { pointsWin, pointsDraw, pointsLoss } = resolvedPointsConfig(tournament.formatConfig)
  const names = new Map(tournament.teams.map((t) => [t.id, t.name]))
  const teamIds = tournament.teams.map((t) => t.id)
  const { map: stats } = initStats(teamIds, names)

  const playedMatches = tournament.matches.filter(isMatchPlayed)
  for (const m of playedMatches) {
    applyMatchResult(stats, m, pointsWin, pointsDraw, pointsLoss)
  }

  const rows = [...stats.values()]
    .sort((a, b) => compareStandings(a, b, playedMatches, pointsWin, pointsDraw))
    .map((s, i) => {
      const { teamId, ...rest } = s
      return {
        rank: i + 1,
        teamId,
        teamName: names.get(teamId) ?? '',
        ...rest,
      }
    })

  return rows
}

/** Собрать множество уже сыгранных пар для швейцарки. */
export async function getPlayedPairKeys(tournamentId: string): Promise<Set<string>> {
  const matches = await prisma.match.findMany({
    where: { tournamentId, teamAId: { not: null }, teamBId: { not: null } },
    select: { teamAId: true, teamBId: true },
  })
  const set = new Set<string>()
  for (const m of matches) {
    if (m.teamAId && m.teamBId) set.add(matchPairKey(m.teamAId, m.teamBId))
  }
  return set
}

/** Строки для внутреннего pairing (без имён). */
export async function getStandingRowsForPairing(tournamentId: string): Promise<
  Array<{ teamId: string; points: number; goalDiff: number; goalsFor: number }>
> {
  const rows = await getStandings(tournamentId)
  return rows.map((r) => ({
    teamId: r.teamId,
    points: r.points,
    goalDiff: r.goalDiff,
    goalsFor: r.goalsFor,
  }))
}
