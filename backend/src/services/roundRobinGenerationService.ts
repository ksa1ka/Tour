import { TournamentFormat } from '@prisma/client'

import { HttpError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import {
  matchWithBracketTeamsSelect,
  type MatchWithBracketTeams,
} from '../prisma/selectFragments.js'
import { matchPairKey } from '../utils/matchPairKey.js'
import {
  buildRoundRobinSchedule,
  ROUND_ROBIN_MAX_TEAMS,
  ROUND_ROBIN_MIN_TEAMS,
} from '../utils/roundRobinSchedule.js'

export type ScheduleMatch = MatchWithBracketTeams

export async function generateRoundRobin(
  tournamentId: string,
  orderedTeamIds: string[],
): Promise<ScheduleMatch[]> {
  const n = orderedTeamIds.length
  if (n < ROUND_ROBIN_MIN_TEAMS || n > ROUND_ROBIN_MAX_TEAMS) {
    throw new HttpError(
      400,
      `Круговая система: от ${ROUND_ROBIN_MIN_TEAMS} до ${ROUND_ROBIN_MAX_TEAMS} команд`,
    )
  }

  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, format: true },
    })

    if (!tournament) throw new HttpError(404, 'Tournament not found')
    if (tournament.format !== TournamentFormat.ROUND_ROBIN) {
      throw new HttpError(400, 'Генерация календаря только для ROUND_ROBIN')
    }

    if (new Set(orderedTeamIds).size !== orderedTeamIds.length) {
      throw new HttpError(400, 'Duplicate team ids')
    }

    const teams = await tx.team.findMany({
      where: { tournamentId, id: { in: orderedTeamIds } },
      select: { id: true },
    })
    if (teams.length !== n) {
      throw new HttpError(400, 'Все команды должны принадлежать турниру')
    }

    await tx.match.deleteMany({ where: { tournamentId } })

    const schedule = buildRoundRobinSchedule(n)
    const seenPairs = new Set<string>()

    for (const slot of schedule) {
      const teamAId = orderedTeamIds[slot.teamAIndex]!
      const teamBId = orderedTeamIds[slot.teamBIndex]!
      const key = matchPairKey(teamAId, teamBId)
      if (seenPairs.has(key)) {
        throw new HttpError(500, 'Internal error: duplicate pair in schedule')
      }
      seenPairs.add(key)

      await tx.match.create({
        data: {
          tournamentId,
          round: slot.round,
          position: slot.position,
          teamAId,
          teamBId,
          nextMatchId: null,
        },
      })
    }

    return tx.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
      select: matchWithBracketTeamsSelect,
    })
  })
}
