import type { Prisma } from '@prisma/client'

import { HttpError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import { matchWithBracketTeamsSelect } from '../prisma/selectFragments.js'
import { feederSlotKey } from '../utils/bracketUtils.js'

type Tx = Prisma.TransactionClient

/**
 * Снимает результат матча и каскадно убирает переданного вверх победителя со слотов следующих матчей.
 */
export async function clearMatchResult(tx: Tx, matchId: string): Promise<void> {
  const m = await tx.match.findUnique({
    where: { id: matchId },
    select: {
      winnerId: true,
      nextMatchId: true,
      position: true,
    },
  })
  if (!m) return

  const w = m.winnerId

  if (m.nextMatchId && w) {
    const next = await tx.match.findUnique({
      where: { id: m.nextMatchId },
      select: {
        id: true,
        teamAId: true,
        teamBId: true,
        winnerId: true,
      },
    })
    if (next) {
      const slot = feederSlotKey(m.position)
      const fedValue = slot === 'teamAId' ? next.teamAId : next.teamBId
      if (fedValue === w) {
        if (next.winnerId) await clearMatchResult(tx, next.id)
        await tx.match.update({
          where: { id: next.id },
          data:
            slot === 'teamAId'
              ? ({ teamAId: null } satisfies Prisma.MatchUncheckedUpdateInput)
              : ({ teamBId: null } satisfies Prisma.MatchUncheckedUpdateInput),
        })
      }
    }
  }

  await tx.match.update({
    where: { id: matchId },
    data: {
      winnerId: null,
      scoreA: null,
      scoreB: null,
      mvpPlayerId: null,
      firstKillPlayerId: null,
    } satisfies Prisma.MatchUncheckedUpdateInput,
  })
}

export type ApplyMatchWinnerInput = {
  winnerId: string
  scoreA?: number | null
  scoreB?: number | null
  mvpPlayerId?: string | null
  firstKillPlayerId?: string | null
}

/**
 * Фиксирует победителя, опционально счёт, переносит победителя в следующий матчей (слот по position).
 * При смене победителя снимает старый результат и каскад вниз по сетке.
 */
export async function applyMatchWinner(
  tournamentId: string,
  matchId: string,
  input: ApplyMatchWinnerInput,
) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findFirst({
      where: { id: matchId, tournamentId },
      select: {
        id: true,
        round: true,
        position: true,
        teamAId: true,
        teamBId: true,
        winnerId: true,
        nextMatchId: true,
      },
    })

    if (!match) {
      throw new HttpError(404, 'Match not found')
    }

    if (!match.teamAId || !match.teamBId) {
      throw new HttpError(400, 'Both teams must be assigned to record a winner')
    }

    const { winnerId } = input
    if (winnerId !== match.teamAId && winnerId !== match.teamBId) {
      throw new HttpError(400, 'Winner must be one of the two teams in the match')
    }

    if (match.winnerId && match.winnerId !== winnerId) {
      await clearMatchResult(tx, match.id)
    }

    if (input.mvpPlayerId) {
      const ok = await tx.player.count({
        where: { id: input.mvpPlayerId, teamId: { in: [match.teamAId, match.teamBId] } },
      })
      if (ok !== 1) throw new HttpError(400, 'MVP должен быть игроком одной из команд матча')
    }
    if (input.firstKillPlayerId) {
      const ok = await tx.player.count({
        where: { id: input.firstKillPlayerId, teamId: { in: [match.teamAId, match.teamBId] } },
      })
      if (ok !== 1) throw new HttpError(400, 'First kill — игрок из состава команд матча')
    }

    const data: Prisma.MatchUncheckedUpdateInput = { winnerId }
    if (input.scoreA !== undefined) data.scoreA = input.scoreA
    if (input.scoreB !== undefined) data.scoreB = input.scoreB
    if (input.mvpPlayerId !== undefined) data.mvpPlayerId = input.mvpPlayerId
    if (input.firstKillPlayerId !== undefined) data.firstKillPlayerId = input.firstKillPlayerId

    await tx.match.update({
      where: { id: match.id },
      data,
    })

    if (match.nextMatchId) {
      const slot = feederSlotKey(match.position)
      const nextData: Prisma.MatchUncheckedUpdateInput =
        slot === 'teamAId' ? { teamAId: winnerId } : { teamBId: winnerId }
      await tx.match.update({
        where: { id: match.nextMatchId },
        data: nextData,
      })
    }

    return tx.match.findUniqueOrThrow({
      where: { id: match.id },
      select: matchWithBracketTeamsSelect,
    })
  })
}
