import { TournamentFormat } from '@prisma/client'

import { HttpError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import {
  matchWithBracketTeamsSelect,
  type MatchWithBracketTeams,
} from '../prisma/selectFragments.js'
import { defaultSwissRounds, resolvedPointsConfig } from '../utils/formatConfig.js'
import { matchPairKey } from '../utils/matchPairKey.js'
import {
  pairSwissRound,
  shuffleTeamIds,
  sortTeamsForSwissPairing,
} from '../utils/swissPairing.js'
import { getPlayedPairKeys, getStandingRowsForPairing } from './standingsService.js'

export type ScheduleMatch = MatchWithBracketTeams

const SWISS_MIN_TEAMS = 4

async function validateTeams(tournamentId: string, orderedTeamIds: string[]) {
  const n = orderedTeamIds.length
  if (n < SWISS_MIN_TEAMS) {
    throw new HttpError(400, `Швейцарка: минимум ${SWISS_MIN_TEAMS} команды`)
  }
  if (new Set(orderedTeamIds).size !== orderedTeamIds.length) {
    throw new HttpError(400, 'Duplicate team ids')
  }
  const teams = await prisma.team.findMany({
    where: { tournamentId, id: { in: orderedTeamIds } },
    select: { id: true },
  })
  if (teams.length !== n) {
    throw new HttpError(400, 'Все команды должны принадлежать турниру')
  }
  return n
}

function isMatchComplete(m: {
  teamAId: string | null
  teamBId: string | null
  scoreA: number | null
  scoreB: number | null
}): boolean {
  if (!m.teamAId) return true
  if (!m.teamBId) return true
  return m.scoreA != null && m.scoreB != null
}

export async function getSwissProgress(tournamentId: string): Promise<{
  currentRound: number
  maxRounds: number
  teamCount: number
  allCurrentRoundComplete: boolean
}> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      format: true,
      formatConfig: true,
      _count: { select: { teams: true } },
      matches: {
        select: {
          round: true,
          teamAId: true,
          teamBId: true,
          scoreA: true,
          scoreB: true,
        },
      },
    },
  })
  if (!tournament) throw new HttpError(404, 'Tournament not found')
  const teamCount = tournament._count.teams
  const cfg = resolvedPointsConfig(tournament.formatConfig)
  const maxRounds = defaultSwissRounds(teamCount, cfg.swissRounds)
  const currentRound =
    tournament.matches.length === 0 ? 0 : Math.max(...tournament.matches.map((m) => m.round))
  const roundMatches = tournament.matches.filter((m) => m.round === currentRound)
  const allCurrentRoundComplete =
    roundMatches.length > 0 && roundMatches.every(isMatchComplete)

  return { currentRound, maxRounds, teamCount, allCurrentRoundComplete }
}

export async function generateSwissRound1(
  tournamentId: string,
  orderedTeamIds?: string[],
): Promise<ScheduleMatch[]> {
  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, format: true, teams: { select: { id: true } } },
    })
    if (!tournament) throw new HttpError(404, 'Tournament not found')
    if (tournament.format !== TournamentFormat.SWISS) {
      throw new HttpError(400, 'Только для SWISS')
    }

    const existing = await tx.match.count({ where: { tournamentId } })
    if (existing > 0) {
      throw new HttpError(400, 'Первый тур уже создан. Используйте «следующий тур».')
    }

    let seeds =
      orderedTeamIds && orderedTeamIds.length > 0
        ? orderedTeamIds
        : tournament.teams.map((t) => t.id)
    await validateTeams(tournamentId, seeds)
    if (!orderedTeamIds || orderedTeamIds.length === 0) {
      seeds = shuffleTeamIds(seeds)
    }

    const playedPairs = new Set<string>()
    let pairs: Array<{ teamAId: string; teamBId: string | null }>
    try {
      pairs = pairSwissRound(seeds, playedPairs)
    } catch {
      throw new HttpError(409, 'Не удалось сформировать пары первого тура')
    }

    let position = 1
    for (const p of pairs) {
      await tx.match.create({
        data: {
          tournamentId,
          round: 1,
          position,
          teamAId: p.teamAId,
          teamBId: p.teamBId,
          nextMatchId: null,
        },
      })
      position++
    }

    return tx.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
      select: matchWithBracketTeamsSelect,
    })
  })
}

export async function generateSwissNextRound(tournamentId: string): Promise<ScheduleMatch[]> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { format: true, formatConfig: true, _count: { select: { teams: true } } },
  })
  if (!tournament) throw new HttpError(404, 'Tournament not found')
  if (tournament.format !== TournamentFormat.SWISS) {
    throw new HttpError(400, 'Только для SWISS')
  }

  const progress = await getSwissProgress(tournamentId)
  if (progress.currentRound === 0) {
    throw new HttpError(400, 'Сначала сформируйте первый тур')
  }
  if (!progress.allCurrentRoundComplete) {
    throw new HttpError(400, 'Завершите все матчи текущего тура')
  }
  if (progress.currentRound >= progress.maxRounds) {
    throw new HttpError(400, `Достигнут лимит туров (${progress.maxRounds})`)
  }

  const nextRound = progress.currentRound + 1
  const standingRows = await getStandingRowsForPairing(tournamentId)
  const ordered = sortTeamsForSwissPairing(standingRows)
  const playedPairs = await getPlayedPairKeys(tournamentId)

  let pairs: Array<{ teamAId: string; teamBId: string | null }>
  try {
    pairs = pairSwissRound(ordered, playedPairs)
  } catch {
    throw new HttpError(409, 'Не удалось подобрать пары без повторных встреч')
  }

  return prisma.$transaction(async (tx) => {
    let position = 1
    for (const p of pairs) {
      const key =
        p.teamBId != null ? matchPairKey(p.teamAId, p.teamBId) : null
      if (key && playedPairs.has(key)) {
        throw new HttpError(409, 'Повторная пара в расписании')
      }
      await tx.match.create({
        data: {
          tournamentId,
          round: nextRound,
          position,
          teamAId: p.teamAId,
          teamBId: p.teamBId,
          nextMatchId: null,
        },
      })
      position++
    }

    return tx.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
      select: matchWithBracketTeamsSelect,
    })
  })
}
