import type { Prisma, TournamentStatus } from '@prisma/client'

import { BadRequestError, HttpError, NotFoundError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import { teamPublicSelect } from '../prisma/selectFragments.js'

import * as fantasyPoints from './fantasyPointsService.js'

const EDITABLE_STATUSES: TournamentStatus[] = ['DRAFT', 'OPEN', 'REGISTRATION']

const fantasyTeamSelect = {
  id: true,
  userId: true,
  tournamentId: true,
  name: true,
  points: true,
  rosterPoints: true,
  fantasyPredictionPoints: true,
  fantasyBonusPoints: true,
  createdAt: true,
  updatedAt: true,
  tournament: {
    select: { id: true, title: true },
  },
  selections: {
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      teamId: true,
      sortOrder: true,
      team: { select: teamPublicSelect },
    },
  },
} satisfies Prisma.FantasyTeamSelect

export type FantasyTeamPublic = Prisma.FantasyTeamGetPayload<{ select: typeof fantasyTeamSelect }>

function assertCanEditPicks(status: TournamentStatus): void {
  if (!EDITABLE_STATUSES.includes(status)) {
    throw new HttpError(403, 'Состав fantasy заблокирован для этого статуса турнира')
  }
}

async function computeRank(tournamentId: string, points: number, createdAt: Date): Promise<number> {
  const better = await prisma.fantasyTeam.count({
    where: {
      tournamentId,
      OR: [{ points: { gt: points } }, { points, createdAt: { lt: createdAt } }],
    },
  })
  return better + 1
}

export async function listFantasyTeamsForUser(userId: string): Promise<FantasyTeamPublic[]> {
  const rows = await prisma.fantasyTeam.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { tournamentId: true },
  })
  const ids = [...new Set(rows.map((r) => r.tournamentId))]
  await Promise.all(ids.map((tid) => fantasyPoints.recalculateFantasyPointsForTournament(tid)))

  return prisma.fantasyTeam.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: fantasyTeamSelect,
  })
}

export async function createFantasyTeam(
  userId: string,
  input: { tournamentId: string; name: string | null },
): Promise<FantasyTeamPublic> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: input.tournamentId },
    select: { id: true, status: true },
  })
  if (!tournament) {
    throw new NotFoundError('Tournament not found')
  }
  assertCanEditPicks(tournament.status)

  return prisma.fantasyTeam.create({
    data: {
      userId,
      tournamentId: input.tournamentId,
      name: input.name,
    },
    select: fantasyTeamSelect,
  })
}

export async function replaceFantasySelections(
  userId: string,
  fantasyTeamId: string,
  teamIds: string[],
): Promise<FantasyTeamPublic> {
  const fantasy = await prisma.fantasyTeam.findFirst({
    where: { id: fantasyTeamId, userId },
    select: { id: true, tournamentId: true },
  })
  if (!fantasy) {
    throw new NotFoundError('Fantasy team not found')
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: fantasy.tournamentId },
    select: { status: true },
  })
  if (!tournament) throw new NotFoundError('Tournament not found')
  assertCanEditPicks(tournament.status)

  const count = await prisma.team.count({
    where: { tournamentId: fantasy.tournamentId, id: { in: teamIds } },
  })
  if (count !== teamIds.length) {
    throw new BadRequestError('Все команды должны принадлежать турниру этой фантазийной команды')
  }

  await prisma.$transaction([
    prisma.fantasyTeamSelection.deleteMany({ where: { fantasyTeamId } }),
    prisma.fantasyTeamSelection.createMany({
      data: teamIds.map((teamId, sortOrder) => ({ fantasyTeamId, teamId, sortOrder })),
    }),
  ])

  await fantasyPoints.recalculateFantasyPointsForTournament(fantasy.tournamentId)

  const updated = await prisma.fantasyTeam.findUnique({
    where: { id: fantasyTeamId },
    select: fantasyTeamSelect,
  })
  if (!updated) {
    throw new NotFoundError('Fantasy team not found')
  }
  return updated
}

export async function upsertMyFantasyTeam(
  userId: string,
  tournamentId: string,
  input: { name?: string | null; teamIds: string[] },
) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, status: true },
  })
  if (!tournament) throw new NotFoundError('Tournament not found')
  assertCanEditPicks(tournament.status)

  const validCount = await prisma.team.count({
    where: { tournamentId, id: { in: input.teamIds } },
  })
  if (validCount !== input.teamIds.length) {
    throw new BadRequestError('Одна или несколько команд не из этого турнира')
  }

  const existing = await prisma.fantasyTeam.findUnique({
    where: { userId_tournamentId: { userId, tournamentId } },
    select: { id: true },
  })

  if (existing) {
    await prisma.$transaction(async (tx) => {
      await tx.fantasyTeamSelection.deleteMany({ where: { fantasyTeamId: existing.id } })
      await tx.fantasyTeam.update({
        where: { id: existing.id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          selections: { create: input.teamIds.map((teamId, sortOrder) => ({ teamId, sortOrder })) },
        },
      })
    })
  } else {
    await prisma.fantasyTeam.create({
      data: {
        userId,
        tournamentId,
        name: input.name ?? null,
        selections: { create: input.teamIds.map((teamId, sortOrder) => ({ teamId, sortOrder })) },
      },
    })
  }

  await fantasyPoints.recalculateFantasyPointsForTournament(tournamentId)
  return getMyFantasyTeam(userId, tournamentId)
}

export async function getMyFantasyTeam(userId: string, tournamentId: string) {
  const exists = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true } })
  if (!exists) throw new NotFoundError('Tournament not found')

  await fantasyPoints.recalculateFantasyPointsForTournament(tournamentId)

  const row = await prisma.fantasyTeam.findUnique({
    where: { userId_tournamentId: { userId, tournamentId } },
    select: {
      id: true,
      points: true,
      rosterPoints: true,
      fantasyPredictionPoints: true,
      fantasyBonusPoints: true,
      name: true,
      createdAt: true,
      user: { select: { id: true, email: true, displayName: true } },
      selections: {
        orderBy: { sortOrder: 'asc' },
        select: {
          team: { select: teamPublicSelect },
        },
      },
    },
  })
  if (!row) return null

  const mvpCorrectCount = await prisma.fantasyMatchPrediction.count({
    where: { fantasyTeamId: row.id, ptsMvp: { gt: 0 } },
  })
  const mvpBadgeTier =
    mvpCorrectCount >= 5 ? 'gold' : mvpCorrectCount >= 3 ? 'silver' : mvpCorrectCount >= 1 ? 'bronze' : null

  const rank = await computeRank(tournamentId, row.points, row.createdAt)
  return {
    ...row,
    rank,
    mvpCorrectCount,
    mvpBadgeTier,
  }
}

export async function getLeaderboard(tournamentId: string, limit = 50, offset = 0) {
  const exists = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true } })
  if (!exists) throw new NotFoundError('Tournament not found')

  await fantasyPoints.recalculateFantasyPointsForTournament(tournamentId)

  const rows = await prisma.fantasyTeam.findMany({
    where: { tournamentId },
    orderBy: [{ points: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    skip: offset,
    select: {
      id: true,
      points: true,
      rosterPoints: true,
      fantasyPredictionPoints: true,
      fantasyBonusPoints: true,
      name: true,
      createdAt: true,
      user: { select: { id: true, email: true, displayName: true } },
      selections: {
        orderBy: { sortOrder: 'asc' },
        select: {
          team: { select: teamPublicSelect },
        },
      },
    },
  })

  return rows.map((r, i) => ({
    rank: offset + i + 1,
    id: r.id,
    points: r.points,
    rosterPoints: r.rosterPoints,
    fantasyPredictionPoints: r.fantasyPredictionPoints,
    fantasyBonusPoints: r.fantasyBonusPoints,
    name: r.name,
    createdAt: r.createdAt,
    user: r.user,
    selections: r.selections,
  }))
}

export async function countFantasyTeams(tournamentId: string): Promise<number> {
  return prisma.fantasyTeam.count({ where: { tournamentId } })
}

export async function getTournamentPickStats(tournamentId: string) {
  const exists = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true } })
  if (!exists) throw new NotFoundError('Tournament not found')

  const winCounts = await fantasyPoints.buildWinCountsByTeamId(tournamentId)
  const teams = await prisma.team.findMany({
    where: { tournamentId },
    select: { id: true, name: true, logo: true },
    orderBy: { name: 'asc' },
  })

  const withWins = teams.map((t) => {
    const wins = winCounts.get(t.id) ?? 0
    return {
      ...t,
      wins,
      pointsFromWins: wins * fantasyPoints.FANTASY_POINTS_PER_WIN,
    }
  })
  withWins.sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))
  return withWins
}

export async function recalculateForTournament(tournamentId: string): Promise<void> {
  const exists = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true } })
  if (!exists) throw new NotFoundError('Tournament not found')
  await fantasyPoints.recalculateFantasyPointsForTournament(tournamentId)
}
