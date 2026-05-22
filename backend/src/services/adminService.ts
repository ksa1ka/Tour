import { TournamentStatus, UserRole } from '@prisma/client'

import { NotFoundError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'

const ACTIVE_TOURNAMENT_STATUSES: TournamentStatus[] = [
  TournamentStatus.OPEN,
  TournamentStatus.REGISTRATION,
  TournamentStatus.IN_PROGRESS,
]

const DASHBOARD_ACTIVITY_DAYS = 14

function daysAgo(days: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

function countByDay(dates: Date[], dayCount: number): { date: string; count: number }[] {
  const start = daysAgo(dayCount - 1)
  const buckets = new Map<string, number>()
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }
  for (const createdAt of dates) {
    const key = createdAt.toISOString().slice(0, 10)
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }))
}

export type AdminDashboardStats = {
  users: {
    total: number
    last30Days: number
    previous30Days: number
    changePercent: number | null
    byRole: { admin: number; player: number; viewer: number }
  }
  tournaments: {
    total: number
    active: number
    createdLast30Days: number
    byStatus: Record<string, number>
  }
  matches: {
    total: number
    played: number
    scheduled: number
  }
  teams: { total: number }
  fantasy: {
    fantasyTeams: number
    uniqueParticipants: number
    tournamentsWithFantasy: number
    predictions: number
    usersWithPredictions: number
    createdLast30Days: number
    previous30Days: number
    changePercent: number | null
  }
  shop: {
    rewards: number
    purchases: number
    totalQuantitySold: number
  }
  activityByDay: {
    date: string
    newUsers: number
    newFantasyTeams: number
    newTeams: number
  }[]
  fantasyFunnel: {
    totalUsers: number
    withFantasyTeam: number
    withPredictions: number
    tournamentsWithFantasy: number
  }
  generatedAt: string
}

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date()
  const days30Ago = daysAgo(30)
  const days60Ago = daysAgo(60)
  const activitySince = daysAgo(DASHBOARD_ACTIVITY_DAYS - 1)

  const [
    usersTotal,
    usersLast30,
    usersPrev30,
    usersByRoleRows,
    usersForActivity,
    tournamentsTotal,
    tournamentsActive,
    tournamentsLast30,
    tournamentStatusRows,
    matchesTotal,
    matchesPlayed,
    matchesScheduled,
    teamsTotal,
    teamsForActivity,
    fantasyTeamsCount,
    fantasyTeamsLast30,
    fantasyTeamsPrev30,
    fantasyTeamsForActivity,
    fantasyParticipantRows,
    tournamentsWithFantasy,
    predictionsCount,
    usersWithPredictions,
    rewardsCount,
    purchaseAgg,
    usersWithFantasyTeam,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: days30Ago } } }),
    prisma.user.count({ where: { createdAt: { gte: days60Ago, lt: days30Ago } } }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.findMany({
      where: { createdAt: { gte: activitySince } },
      select: { createdAt: true },
    }),
    prisma.tournament.count(),
    prisma.tournament.count({ where: { status: { in: ACTIVE_TOURNAMENT_STATUSES } } }),
    prisma.tournament.count({ where: { createdAt: { gte: days30Ago } } }),
    prisma.tournament.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.match.count(),
    prisma.match.count({ where: { winnerId: { not: null } } }),
    prisma.match.count({
      where: { winnerId: null, teamAId: { not: null }, teamBId: { not: null } },
    }),
    prisma.team.count(),
    prisma.team.findMany({
      where: { createdAt: { gte: activitySince } },
      select: { createdAt: true },
    }),
    prisma.fantasyTeam.count(),
    prisma.fantasyTeam.count({ where: { createdAt: { gte: days30Ago } } }),
    prisma.fantasyTeam.count({ where: { createdAt: { gte: days60Ago, lt: days30Ago } } }),
    prisma.fantasyTeam.findMany({
      where: { createdAt: { gte: activitySince } },
      select: { createdAt: true },
    }),
    prisma.fantasyTeam.findMany({ select: { userId: true }, distinct: ['userId'] }),
    prisma.tournament.count({ where: { fantasyTeams: { some: {} } } }),
    prisma.fantasyMatchPrediction.count(),
    prisma.user.count({
      where: { fantasyTeams: { some: { matchPredictions: { some: {} } } } },
    }),
    prisma.reward.count(),
    prisma.userReward.aggregate({ _count: { id: true }, _sum: { quantity: true } }),
    prisma.user.count({ where: { fantasyTeams: { some: {} } } }),
  ])

  const byRole = { admin: 0, player: 0, viewer: 0 }
  for (const row of usersByRoleRows) {
    if (row.role === UserRole.ADMIN) byRole.admin = row._count._all
    else if (row.role === UserRole.PLAYER) byRole.player = row._count._all
    else if (row.role === UserRole.VIEWER) byRole.viewer = row._count._all
  }

  const byStatus: Record<string, number> = {}
  for (const row of tournamentStatusRows) {
    byStatus[row.status] = row._count._all
  }

  const userDays = countByDay(
    usersForActivity.map((u) => u.createdAt),
    DASHBOARD_ACTIVITY_DAYS,
  )
  const fantasyDays = countByDay(
    fantasyTeamsForActivity.map((f) => f.createdAt),
    DASHBOARD_ACTIVITY_DAYS,
  )
  const teamDays = countByDay(
    teamsForActivity.map((t) => t.createdAt),
    DASHBOARD_ACTIVITY_DAYS,
  )

  const activityByDay = userDays.map((u, i) => ({
    date: u.date,
    newUsers: u.count,
    newFantasyTeams: fantasyDays[i]?.count ?? 0,
    newTeams: teamDays[i]?.count ?? 0,
  }))

  return {
    users: {
      total: usersTotal,
      last30Days: usersLast30,
      previous30Days: usersPrev30,
      changePercent: percentChange(usersLast30, usersPrev30),
      byRole,
    },
    tournaments: {
      total: tournamentsTotal,
      active: tournamentsActive,
      createdLast30Days: tournamentsLast30,
      byStatus,
    },
    matches: {
      total: matchesTotal,
      played: matchesPlayed,
      scheduled: matchesScheduled,
    },
    teams: { total: teamsTotal },
    fantasy: {
      fantasyTeams: fantasyTeamsCount,
      uniqueParticipants: fantasyParticipantRows.length,
      tournamentsWithFantasy,
      predictions: predictionsCount,
      usersWithPredictions,
      createdLast30Days: fantasyTeamsLast30,
      previous30Days: fantasyTeamsPrev30,
      changePercent: percentChange(fantasyTeamsLast30, fantasyTeamsPrev30),
    },
    shop: {
      rewards: rewardsCount,
      purchases: purchaseAgg._count.id,
      totalQuantitySold: purchaseAgg._sum.quantity ?? 0,
    },
    activityByDay,
    fantasyFunnel: {
      totalUsers: usersTotal,
      withFantasyTeam: usersWithFantasyTeam,
      withPredictions: usersWithPredictions,
      tournamentsWithFantasy,
    },
    generatedAt: now.toISOString(),
  }
}

export type AdminUserListItem = {
  id: string
  email: string
  role: string
  displayName: string | null
  fantasyPointsBalance: number
  createdAt: string
}

export type AdminFantasyTeamListItem = {
  id: string
  fantasyTeamName: string | null
  points: number
  tournamentId: string
  tournamentTitle: string
  userId: string
  userEmail: string
  userDisplayName: string | null
  updatedAt: string
}

export type AdminRewardPurchaseListItem = {
  id: string
  quantity: number
  acquiredAt: string
  userId: string
  userEmail: string
  userDisplayName: string | null
  rewardId: string
  rewardTitle: string
  rewardPrice: number
}

export type AdminShopRewardListItem = {
  id: string
  title: string
  description: string
  price: number
  image: string
  sortOrder: number
}

export async function listUsersForAdmin(): Promise<AdminUserListItem[]> {
  const rows = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      displayName: true,
      fantasyPointsBalance: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function listFantasyTeamsForAdmin(): Promise<AdminFantasyTeamListItem[]> {
  const rows = await prisma.fantasyTeam.findMany({
    select: {
      id: true,
      name: true,
      points: true,
      updatedAt: true,
      userId: true,
      tournament: { select: { id: true, title: true } },
      user: { select: { email: true, displayName: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: 1000,
  })
  return rows.map((r) => ({
    id: r.id,
    fantasyTeamName: r.name,
    points: r.points,
    tournamentId: r.tournament.id,
    tournamentTitle: r.tournament.title,
    userId: r.userId,
    userEmail: r.user.email,
    userDisplayName: r.user.displayName,
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function listShopRewardsForAdmin(): Promise<AdminShopRewardListItem[]> {
  const rows = await prisma.reward.findMany({
    orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      image: true,
      sortOrder: true,
    },
  })
  return rows
}

export async function updateShopRewardImage(rewardId: string, image: string): Promise<AdminShopRewardListItem> {
  const exists = await prisma.reward.findUnique({
    where: { id: rewardId },
    select: { id: true },
  })
  if (!exists) {
    throw new NotFoundError('Товар не найден')
  }
  const updated = await prisma.reward.update({
    where: { id: rewardId },
    data: { image },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      image: true,
      sortOrder: true,
    },
  })
  return updated
}

export async function listRewardPurchasesForAdmin(): Promise<AdminRewardPurchaseListItem[]> {
  const rows = await prisma.userReward.findMany({
    select: {
      id: true,
      quantity: true,
      acquiredAt: true,
      userId: true,
      rewardId: true,
      user: { select: { email: true, displayName: true } },
      reward: { select: { id: true, title: true, price: true } },
    },
    orderBy: { acquiredAt: 'desc' },
    take: 1000,
  })
  return rows.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    acquiredAt: r.acquiredAt.toISOString(),
    userId: r.userId,
    userEmail: r.user.email,
    userDisplayName: r.user.displayName,
    rewardId: r.reward.id,
    rewardTitle: r.reward.title,
    rewardPrice: r.reward.price,
  }))
}
