import { prisma } from '../prisma/client.js'
import { emitFantasyUpdated } from '../socket/tournamentEmit.js'

import * as fantasyPrediction from './fantasyPredictionService.js'

/** Очки за каждую победу выбранной команды в матчах турнира */
export const FANTASY_POINTS_PER_WIN = 10

export async function buildWinCountsByTeamId(tournamentId: string): Promise<Map<string, number>> {
  const wins = await prisma.match.groupBy({
    by: ['winnerId'],
    where: { tournamentId, winnerId: { not: null } },
    _count: { winnerId: true },
  })
  const map = new Map<string, number>()
  for (const row of wins) {
    if (row.winnerId) map.set(row.winnerId, row._count.winnerId)
  }
  return map
}

export function pointsForSelections(teamIds: string[], winCounts: Map<string, number>): number {
  let total = 0
  for (const tid of teamIds) {
    total += (winCounts.get(tid) ?? 0) * FANTASY_POINTS_PER_WIN
  }
  return total
}

/** Пересчитывает очки fantasy: состав (победы), прогнозы и бонусы. */
export async function recalculateFantasyPointsForTournament(tournamentId: string): Promise<void> {
  await fantasyPrediction.regradeAllPredictionsForTournament(tournamentId)

  const winCounts = await buildWinCountsByTeamId(tournamentId)
  const teams = await prisma.fantasyTeam.findMany({
    where: { tournamentId },
    select: {
      id: true,
      userId: true,
      fantasyPredictionPoints: true,
      fantasyBonusPoints: true,
      selections: { orderBy: { sortOrder: 'asc' }, select: { teamId: true } },
    },
  })

  const sums = await prisma.fantasyMatchPrediction.groupBy({
    by: ['fantasyTeamId'],
    where: { fantasyTeam: { tournamentId } },
    _sum: {
      ptsWinner: true,
      ptsMvp: true,
      ptsFirstKill: true,
      ptsHighestScore: true,
      ptsExactScore: true,
      bonusPts: true,
    },
  })
  const predSumByFt = new Map<string, { base: number; bonus: number }>()
  for (const row of sums) {
    const base =
      (row._sum.ptsWinner ?? 0) +
      (row._sum.ptsMvp ?? 0) +
      (row._sum.ptsFirstKill ?? 0) +
      (row._sum.ptsHighestScore ?? 0) +
      (row._sum.ptsExactScore ?? 0)
    predSumByFt.set(row.fantasyTeamId, { base, bonus: row._sum.bonusPts ?? 0 })
  }

  if (teams.length === 0) {
    emitFantasyUpdated(tournamentId)
    return
  }

  const notifyUserIds = [...new Set(teams.map((t) => t.userId))]

  await prisma.$transaction(async (tx) => {
    for (const ft of teams) {
      const roster = pointsForSelections(
        ft.selections.map((s) => s.teamId),
        winCounts,
      )
      const p = predSumByFt.get(ft.id) ?? { base: 0, bonus: 0 }
      const total = roster + p.base + p.bonus
      const prevPredShop = ft.fantasyPredictionPoints + ft.fantasyBonusPoints
      const nextPredShop = p.base + p.bonus
      const shopDelta = nextPredShop - prevPredShop

      await tx.fantasyTeam.update({
        where: { id: ft.id },
        data: {
          rosterPoints: roster,
          fantasyPredictionPoints: p.base,
          fantasyBonusPoints: p.bonus,
          points: total,
        },
      })

      if (shopDelta !== 0) {
        await tx.user.update({
          where: { id: ft.userId },
          data: { fantasyPointsBalance: { increment: shopDelta } },
        })
      }
    }
  })

  emitFantasyUpdated(tournamentId, { notifyUserIds })
}
