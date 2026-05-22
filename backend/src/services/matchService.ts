import { TournamentFormat } from '@prisma/client'

import { BadRequestError, NotFoundError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import {
  matchWithBracketTeamsSelect,
  type MatchWithBracketTeams,
} from '../prisma/selectFragments.js'
import * as matchPropagation from './matchPropagationService.js'
import * as scheduleMatchService from './scheduleMatchService.js'

export type MatchPublic = MatchWithBracketTeams

/**
 * Обновляет счёт / сбрасывает результат, переносит победителя в next match (single elimination),
 * при смене победителя или сбросе — каскад через matchPropagationService.
 */
export async function updateMatchResult(
  tournamentId: string,
  matchId: string,
  input:
    | { mode: 'set'; scoreA: number; scoreB: number; mvpPlayerId?: string | null; firstKillPlayerId?: string | null }
    | { mode: 'clear' },
): Promise<MatchPublic> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { format: true },
  })
  if (!tournament) {
    throw new NotFoundError('Tournament not found')
  }

  if (
    tournament.format === TournamentFormat.ROUND_ROBIN ||
    tournament.format === TournamentFormat.SWISS
  ) {
    return scheduleMatchService.updateScheduleMatchResult(tournamentId, matchId, input)
  }

  if (tournament.format !== TournamentFormat.SINGLE_ELIMINATION) {
    throw new BadRequestError('Формат турнира не поддерживает ввод результатов матчей')
  }

  if (input.mode === 'clear') {
    await prisma.$transaction(async (tx) => {
      const m = await tx.match.findFirst({
        where: { id: matchId, tournamentId },
        select: { id: true },
      })
      if (!m) {
        throw new NotFoundError('Match not found')
      }
      await matchPropagation.clearMatchResult(tx, matchId)
    })
    return prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      select: matchWithBracketTeamsSelect,
    })
  }

  if (input.scoreA === input.scoreB) {
    throw new BadRequestError('На вылете ничья недопустима')
  }

  const row = await prisma.match.findFirst({
    where: { id: matchId, tournamentId },
    select: { teamAId: true, teamBId: true },
  })
  if (!row) {
    throw new NotFoundError('Match not found')
  }
  if (!row.teamAId || !row.teamBId) {
    throw new BadRequestError('В матче должны быть обе команды, чтобы зафиксировать счёт')
  }

  const winnerId = input.scoreA > input.scoreB ? row.teamAId : row.teamBId

  await matchPropagation.applyMatchWinner(tournamentId, matchId, {
    winnerId,
    scoreA: input.scoreA,
    scoreB: input.scoreB,
    mvpPlayerId: input.mvpPlayerId,
    firstKillPlayerId: input.firstKillPlayerId,
  })

  return prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: matchWithBracketTeamsSelect,
  })
}
