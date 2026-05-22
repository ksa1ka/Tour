import type { TournamentFormat, TournamentStatus } from '@prisma/client'

import { prisma } from '../prisma/client.js'
import type { UpdateProfileBody } from '../validation/profileValidation.js'

export type TournamentHistoryItem = {
  tournamentId: string
  title: string
  status: TournamentStatus
  format: TournamentFormat
  updatedAt: string
  roles: ('organizer' | 'fantasy')[]
}

export type FantasyEntry = {
  fantasyTeamId: string
  name: string | null
  points: number
  picksCount: number
  tournamentId: string
  tournamentTitle: string
  updatedAt: string
}

export type FantasySummary = {
  /** Баланс FP для магазина (как на странице «Магазин»). */
  fantasyPointsBalance: number
  fantasyTeamCount: number
  /** Сумма рейтинговых очков по всем турнирам (лидерборд). */
  tournamentPointsTotal: number
  averagePointsPerTeam: number
  totalPicks: number
  bestScore: number | null
}

export type UserProfileBundle = {
  id: string
  email: string
  role: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  memberSince: string
  tournamentHistory: TournamentHistoryItem[]
  fantasy: {
    summary: FantasySummary
    entries: FantasyEntry[]
  }
}

/** Публичный профиль (без email) для просмотра другими пользователями. */
export type PublicUserProfileBundle = Omit<UserProfileBundle, 'email'>

type HistoryRow = {
  tournamentId: string
  title: string
  status: TournamentStatus
  format: TournamentFormat
  updatedAt: Date
  roles: Set<'organizer' | 'fantasy'>
}

export async function getUserProfileBundle(userId: string): Promise<UserProfileBundle | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      fantasyPointsBalance: true,
      createdAt: true,
      tournamentsCreated: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          format: true,
          updatedAt: true,
        },
      },
      fantasyTeams: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          points: true,
          updatedAt: true,
          tournament: {
            select: {
              id: true,
              title: true,
              status: true,
              format: true,
              updatedAt: true,
            },
          },
          selections: {
            select: { id: true },
          },
        },
      },
    },
  })

  if (!user) {
    return null
  }

  const historyMap = new Map<string, HistoryRow>()

  for (const t of user.tournamentsCreated) {
    historyMap.set(t.id, {
      tournamentId: t.id,
      title: t.title,
      status: t.status,
      format: t.format,
      updatedAt: t.updatedAt,
      roles: new Set(['organizer']),
    })
  }

  for (const ft of user.fantasyTeams) {
    const tr = ft.tournament
    const row = historyMap.get(tr.id)
    if (row) {
      row.roles.add('fantasy')
      if (tr.updatedAt > row.updatedAt) {
        row.updatedAt = tr.updatedAt
      }
    } else {
      historyMap.set(tr.id, {
        tournamentId: tr.id,
        title: tr.title,
        status: tr.status,
        format: tr.format,
        updatedAt: tr.updatedAt,
        roles: new Set(['fantasy']),
      })
    }
  }

  const tournamentHistory: TournamentHistoryItem[] = [...historyMap.values()]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((r) => ({
      tournamentId: r.tournamentId,
      title: r.title,
      status: r.status,
      format: r.format,
      updatedAt: r.updatedAt.toISOString(),
      roles: [...r.roles],
    }))

  const entries: FantasyEntry[] = user.fantasyTeams.map((ft) => ({
    fantasyTeamId: ft.id,
    name: ft.name,
    points: ft.points,
    picksCount: ft.selections.length,
    tournamentId: ft.tournament.id,
    tournamentTitle: ft.tournament.title,
    updatedAt: ft.updatedAt.toISOString(),
  }))

  const fantasyTeamCount = user.fantasyTeams.length
  const tournamentPointsTotal = user.fantasyTeams.reduce((acc, ft) => acc + ft.points, 0)
  const totalPicks = user.fantasyTeams.reduce((acc, ft) => acc + ft.selections.length, 0)
  const averagePointsPerTeam =
    fantasyTeamCount === 0
      ? 0
      : Math.round((tournamentPointsTotal / fantasyTeamCount) * 10) / 10
  const bestScore =
    fantasyTeamCount === 0 ? null : Math.max(...user.fantasyTeams.map((ft) => ft.points))

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    memberSince: user.createdAt.toISOString(),
    tournamentHistory,
    fantasy: {
      summary: {
        fantasyPointsBalance: user.fantasyPointsBalance,
        fantasyTeamCount,
        tournamentPointsTotal,
        averagePointsPerTeam,
        totalPicks,
        bestScore,
      },
      entries,
    },
  }
}

export async function getUserPublicProfileBundle(userId: string): Promise<PublicUserProfileBundle | null> {
  const bundle = await getUserProfileBundle(userId)
  if (!bundle) return null
  const { email: _email, ...publicProfile } = bundle
  return publicProfile
}

export async function updateUserProfile(userId: string, data: UpdateProfileBody): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    },
  })
}
