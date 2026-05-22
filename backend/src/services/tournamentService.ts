import type { Prisma, TournamentFormat, TournamentGame, TournamentStatus } from '@prisma/client'

import { prisma } from '../prisma/client.js'
import { teamPublicSelect } from '../prisma/selectFragments.js'

const tournamentPublicSelect = {
  id: true,
  title: true,
  description: true,
  avatarUrl: true,
  game: true,
  format: true,
  status: true,
  fantasyActivePredictions: true,
  formatConfig: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: { id: true, email: true, role: true },
  },
} satisfies Prisma.TournamentSelect

const tournamentDetailSelect = {
  ...tournamentPublicSelect,
  _count: {
    select: { teams: true, matches: true },
  },
  teams: {
    orderBy: { name: 'asc' },
    select: teamPublicSelect,
  },
} satisfies Prisma.TournamentSelect

export type TournamentPublic = Prisma.TournamentGetPayload<{ select: typeof tournamentPublicSelect }>
export type TournamentDetail = Prisma.TournamentGetPayload<{ select: typeof tournamentDetailSelect }>

function normalizeDescription(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null
  const t = value.trim()
  return t.length === 0 ? null : t
}

function normalizeAvatarUrl(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null
  const t = value.trim()
  return t.length === 0 ? null : t
}

export async function listTournaments(filters?: { game?: TournamentGame }): Promise<TournamentPublic[]> {
  return prisma.tournament.findMany({
    where: filters?.game !== undefined ? { game: filters.game } : undefined,
    orderBy: { createdAt: 'desc' },
    select: tournamentPublicSelect,
  })
}

export async function getTournamentById(id: string): Promise<TournamentDetail | null> {
  return prisma.tournament.findUnique({
    where: { id },
    select: tournamentDetailSelect,
  })
}

export async function tournamentExists(id: string): Promise<boolean> {
  const row = await prisma.tournament.findUnique({ where: { id }, select: { id: true } })
  return row !== null
}

export async function createTournament(
  createdBy: string,
  input: {
    title: string
    description?: string | null
    avatarUrl?: string | null
    game: TournamentGame
    format: TournamentFormat
    formatConfig?: unknown
    status?: TournamentStatus
  },
): Promise<TournamentPublic> {
  return prisma.tournament.create({
    data: {
      title: input.title.trim(),
      description: normalizeDescription(input.description),
      avatarUrl: normalizeAvatarUrl(input.avatarUrl),
      game: input.game,
      format: input.format,
      ...(input.formatConfig !== undefined
        ? { formatConfig: input.formatConfig as Prisma.InputJsonValue }
        : {}),
      createdBy,
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    select: tournamentPublicSelect,
  })
}

export async function updateTournament(
  id: string,
  input: {
    title?: string
    description?: string | null
    avatarUrl?: string | null
    game?: TournamentGame
    format?: TournamentFormat
    formatConfig?: unknown
    status?: TournamentStatus
    fantasyActivePredictions?: unknown
  },
): Promise<TournamentPublic> {
  const data: Prisma.TournamentUpdateInput = {}
  if (input.title !== undefined) data.title = input.title.trim()
  if (input.description !== undefined) data.description = normalizeDescription(input.description)
  if (input.avatarUrl !== undefined) data.avatarUrl = normalizeAvatarUrl(input.avatarUrl)
  if (input.game !== undefined) data.game = input.game
  if (input.format !== undefined) data.format = input.format
  if (input.status !== undefined) data.status = input.status
  if (input.formatConfig !== undefined) {
    data.formatConfig = input.formatConfig as Prisma.InputJsonValue
  }
  if (input.fantasyActivePredictions !== undefined) {
    data.fantasyActivePredictions = input.fantasyActivePredictions as Prisma.InputJsonValue
  }

  return prisma.tournament.update({
    where: { id },
    data,
    select: tournamentPublicSelect,
  })
}

export async function deleteTournament(id: string): Promise<void> {
  await prisma.tournament.delete({
    where: { id },
  })
}
