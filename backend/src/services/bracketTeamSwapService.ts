import { TournamentFormat } from '@prisma/client'
import type { Prisma } from '@prisma/client'

import { prisma } from '../prisma/client.js'
import { HttpError } from '../errors/HttpError.js'
import { listBracketMatches, type BracketMatch } from './bracketGenerationService.js'

export type BracketSlotSide = 'A' | 'B'

export type SwapBracketTeamSlotsInput = {
  fromMatchId: string
  fromSide: BracketSlotSide
  toMatchId: string
  toSide: BracketSlotSide
}

function slotField(side: BracketSlotSide): 'teamAId' | 'teamBId' {
  return side === 'A' ? 'teamAId' : 'teamBId'
}

/**
 * Меняет местами команды в двух слотах сетки (только 1-й раунд, матчи без результата).
 * Подходит для корректировки посева до начала игр.
 */
export async function swapBracketTeamSlots(
  tournamentId: string,
  input: SwapBracketTeamSlotsInput,
): Promise<BracketMatch[]> {
  const { fromMatchId, fromSide, toMatchId, toSide } = input

  if (fromMatchId === toMatchId && fromSide === toSide) {
    throw new HttpError(400, 'Источник и цель совпадают')
  }

  await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, format: true },
    })
    if (!tournament) {
      throw new HttpError(404, 'Tournament not found')
    }
    if (tournament.format !== TournamentFormat.SINGLE_ELIMINATION) {
      throw new HttpError(400, 'Перестановка доступна только для SINGLE_ELIMINATION')
    }

    const ids = fromMatchId === toMatchId ? [fromMatchId] : [fromMatchId, toMatchId]
    const matches = await tx.match.findMany({
      where: { tournamentId, id: { in: ids } },
      select: {
        id: true,
        round: true,
        teamAId: true,
        teamBId: true,
        winnerId: true,
        scoreA: true,
        scoreB: true,
      },
    })

    if (matches.length !== ids.length) {
      throw new HttpError(404, 'Match not found')
    }

    const mFrom = matches.find((m) => m.id === fromMatchId)
    const mTo = matches.find((m) => m.id === toMatchId)
    if (!mFrom || !mTo) {
      throw new HttpError(404, 'Match not found')
    }

    for (const m of [mFrom, mTo]) {
      if (m.round !== 1) {
        throw new HttpError(400, 'Менять состав пар можно только в первом раунде')
      }
      if (m.winnerId != null) {
        throw new HttpError(400, 'Нельзя менять команды в матче с зафиксированным результатом')
      }
      if (m.scoreA != null || m.scoreB != null) {
        throw new HttpError(400, 'Сначала сбросьте счёт матча')
      }
    }

    const fromKey = slotField(fromSide)
    const toKey = slotField(toSide)

    if (fromMatchId === toMatchId) {
      const vFrom = mFrom[fromKey]
      const vTo = mFrom[toKey]
      await tx.match.update({
        where: { id: fromMatchId },
        data: { [fromKey]: vTo, [toKey]: vFrom } as Prisma.MatchUncheckedUpdateInput,
      })
    } else {
      const fromVal = mFrom[fromKey]
      const toVal = mTo[toKey]
      await tx.match.update({
        where: { id: fromMatchId },
        data: { [fromKey]: toVal } as Prisma.MatchUncheckedUpdateInput,
      })
      await tx.match.update({
        where: { id: toMatchId },
        data: { [toKey]: fromVal } as Prisma.MatchUncheckedUpdateInput,
      })
    }
  })

  return listBracketMatches(tournamentId)
}
