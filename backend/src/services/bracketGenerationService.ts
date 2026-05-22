import { TournamentFormat } from '@prisma/client'

import { HttpError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import {
  matchWithBracketTeamsSelect,
  type MatchWithBracketTeams,
} from '../prisma/selectFragments.js'
import {
  isSingleEliminationTeamCount,
  matchesInRound,
  singleEliminationRoundCount,
  type SingleEliminationTeamCount,
} from '../utils/bracketUtils.js'

export type BracketMatch = MatchWithBracketTeams

/**
 * Удаляет старые матчи турнира и создаёт полную single elimination сетку.
 * `orderedTeamIds` — порядок посева: пары (0,1), (2,3), … играют в 1-м раунде.
 */
export async function generateSingleEliminationBracket(
  tournamentId: string,
  orderedTeamIds: string[],
): Promise<BracketMatch[]> {
  const n = orderedTeamIds.length
  if (!isSingleEliminationTeamCount(n)) {
    throw new HttpError(400, 'Bracket requires exactly 4, 8, 16, or 32 teams')
  }
  const teamCount: SingleEliminationTeamCount = n

  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, format: true },
    })

    if (!tournament) {
      throw new HttpError(404, 'Tournament not found')
    }

    if (tournament.format !== TournamentFormat.SINGLE_ELIMINATION) {
      throw new HttpError(400, 'Bracket generation is only for SINGLE_ELIMINATION tournaments')
    }

    if (new Set(orderedTeamIds).size !== orderedTeamIds.length) {
      throw new HttpError(400, 'Duplicate team ids in bracket seed')
    }

    const teams = await tx.team.findMany({
      where: { tournamentId, id: { in: orderedTeamIds } },
      select: { id: true },
    })

    if (teams.length !== teamCount) {
      throw new HttpError(400, 'All teams must belong to the tournament and match bracket size')
    }

    await tx.match.deleteMany({ where: { tournamentId } })

    const numRounds = singleEliminationRoundCount(teamCount)
    const idByRoundPos = new Map<string, string>()

    for (let round = numRounds; round >= 1; round--) {
      const count = matchesInRound(teamCount, round)
      for (let position = 1; position <= count; position++) {
        const keyNext = `${round + 1}-${Math.ceil(position / 2)}`
        const nextMatchId =
          round < numRounds ? (idByRoundPos.get(keyNext) ?? null) : null

        let teamAId: string | null = null
        let teamBId: string | null = null
        if (round === 1) {
          const i = (position - 1) * 2
          teamAId = orderedTeamIds[i]!
          teamBId = orderedTeamIds[i + 1]!
        }

        const created = await tx.match.create({
          data: {
            tournamentId,
            round,
            position,
            teamAId,
            teamBId,
            nextMatchId,
          },
          select: { id: true },
        })

        idByRoundPos.set(`${round}-${position}`, created.id)
      }
    }

    return tx.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
      select: matchWithBracketTeamsSelect,
    })
  })
}

export async function listBracketMatches(tournamentId: string): Promise<BracketMatch[]> {
  const exists = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  })
  if (!exists) {
    throw new HttpError(404, 'Tournament not found')
  }

  return prisma.match.findMany({
    where: { tournamentId },
    orderBy: [{ round: 'asc' }, { position: 'asc' }],
    select: matchWithBracketTeamsSelect,
  })
}
