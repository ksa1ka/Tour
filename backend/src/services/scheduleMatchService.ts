import type { Prisma } from '@prisma/client'
import { TournamentFormat } from '@prisma/client'

import { BadRequestError, NotFoundError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import {
  matchWithBracketTeamsSelect,
  type MatchWithBracketTeams,
} from '../prisma/selectFragments.js'

export type ScheduleMatchPublic = MatchWithBracketTeams

/**
 * Обновление результата для ROUND_ROBIN / SWISS (без propagation, ничья разрешена).
 */
export async function updateScheduleMatchResult(
  tournamentId: string,
  matchId: string,
  input:
    | { mode: 'set'; scoreA: number; scoreB: number; mvpPlayerId?: string | null; firstKillPlayerId?: string | null }
    | { mode: 'clear' },
): Promise<ScheduleMatchPublic> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { format: true },
  })
  if (!tournament) throw new NotFoundError('Tournament not found')

  const fmt = tournament.format
  if (fmt !== TournamentFormat.ROUND_ROBIN && fmt !== TournamentFormat.SWISS) {
    throw new BadRequestError('Метод только для круговой или швейцарской системы')
  }

  if (input.mode === 'clear') {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId: null,
        scoreA: null,
        scoreB: null,
        mvpPlayerId: null,
        firstKillPlayerId: null,
      },
    })
    return prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      select: matchWithBracketTeamsSelect,
    })
  }

  const row = await prisma.match.findFirst({
    where: { id: matchId, tournamentId },
    select: { teamAId: true, teamBId: true },
  })
  if (!row) throw new NotFoundError('Match not found')

  if (!row.teamAId) {
    throw new BadRequestError('Команда с bye — матч без соперника')
  }
  if (!row.teamBId) {
    throw new BadRequestError('Команда с bye — матч без соперника')
  }

  let winnerId: string | null = null
  if (input.scoreA > input.scoreB) winnerId = row.teamAId
  else if (input.scoreB > input.scoreA) winnerId = row.teamBId

  const data: Prisma.MatchUncheckedUpdateInput = {
    scoreA: input.scoreA,
    scoreB: input.scoreB,
    winnerId,
  }
  if (input.mvpPlayerId !== undefined) data.mvpPlayerId = input.mvpPlayerId
  if (input.firstKillPlayerId !== undefined) data.firstKillPlayerId = input.firstKillPlayerId

  await prisma.match.update({ where: { id: matchId }, data })

  return prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: matchWithBracketTeamsSelect,
  })
}
