import type { Prisma } from '@prisma/client'

import { ConflictError, NotFoundError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import { teamPublicSelect, type TeamPublic } from '../prisma/selectFragments.js'

export type { TeamPublic }

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null
  const t = value.trim()
  return t.length === 0 ? null : t
}

function normalizeLogo(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null
  const t = value.trim()
  return t.length === 0 ? null : t
}

function cmpKey(value: string): string {
  return value.trim().toLowerCase()
}

async function assertUniqueTeamName(tournamentId: string, name: string, excludeTeamId?: string) {
  const key = cmpKey(name)
  if (!key) return
  const teams = await prisma.team.findMany({
    where: { tournamentId },
    select: { id: true, name: true },
  })
  const clash = teams.find((t) => t.id !== excludeTeamId && cmpKey(t.name) === key)
  if (clash) {
    throw new ConflictError('В этом турнире уже есть команда с таким названием')
  }
}

async function assertUniquePlayerNickname(teamId: string, nickname: string, excludePlayerId?: string) {
  const key = cmpKey(nickname)
  if (!key) return
  const players = await prisma.player.findMany({
    where: { teamId },
    select: { id: true, nickname: true },
  })
  const clash = players.find((p) => p.id !== excludePlayerId && cmpKey(p.nickname) === key)
  if (clash) {
    throw new ConflictError('В составе уже есть игрок с таким никнеймом')
  }
}

export async function listTeamsByTournament(tournamentId: string): Promise<TeamPublic[]> {
  return prisma.team.findMany({
    where: { tournamentId },
    orderBy: { name: 'asc' },
    select: teamPublicSelect,
  })
}

export async function listTeams(filters?: { tournamentId?: string }): Promise<TeamPublic[]> {
  return prisma.team.findMany({
    where: filters?.tournamentId ? { tournamentId: filters.tournamentId } : undefined,
    orderBy: [{ tournament: { title: 'asc' } }, { name: 'asc' }],
    select: teamPublicSelect,
  })
}

export async function getTeamInTournament(tournamentId: string, teamId: string): Promise<TeamPublic | null> {
  return prisma.team.findFirst({
    where: { id: teamId, tournamentId },
    select: teamPublicSelect,
  })
}

export async function createTeam(
  tournamentId: string,
  input: { name: string; logo?: string | null },
): Promise<TeamPublic> {
  const trimmedName = input.name.trim()
  await assertUniqueTeamName(tournamentId, trimmedName)
  return prisma.team.create({
    data: {
      name: trimmedName,
      logo: normalizeLogo(input.logo ?? null),
      tournamentId,
    },
    select: teamPublicSelect,
  })
}

export async function updateTeam(
  tournamentId: string,
  teamId: string,
  input: { name?: string; logo?: string | null },
): Promise<TeamPublic> {
  const inTournament = await prisma.team.findFirst({
    where: { id: teamId, tournamentId },
    select: { id: true },
  })
  if (!inTournament) {
    throw new NotFoundError()
  }

  const data: Prisma.TeamUpdateInput = {}
  if (input.name !== undefined) {
    const trimmed = input.name.trim()
    await assertUniqueTeamName(tournamentId, trimmed, teamId)
    data.name = trimmed
  }
  if (input.logo !== undefined) data.logo = normalizeLogo(input.logo)

  return prisma.team.update({
    where: { id: teamId },
    data,
    select: teamPublicSelect,
  })
}

export async function deleteTeam(tournamentId: string, teamId: string): Promise<void> {
  const inTournament = await prisma.team.findFirst({
    where: { id: teamId, tournamentId },
    select: { id: true },
  })
  if (!inTournament) {
    throw new NotFoundError()
  }

  await prisma.team.delete({
    where: { id: teamId },
  })
}

export async function addPlayerToTeam(
  tournamentId: string,
  teamId: string,
  input: {
    nickname: string
    realName?: string | null
    role: string
    country?: string | null
    avatar?: string | null
    isStarter?: boolean
  },
): Promise<TeamPublic> {
  const inTournament = await prisma.team.findFirst({
    where: { id: teamId, tournamentId },
    select: { id: true },
  })
  if (!inTournament) throw new NotFoundError()

  const nick = input.nickname.trim()
  await assertUniquePlayerNickname(teamId, nick)

  await prisma.player.create({
    data: {
      teamId,
      nickname: nick,
      realName: normalizeNullableText(input.realName ?? null),
      role: input.role.trim(),
      country: normalizeNullableText(input.country ?? null),
      avatar: normalizeLogo(input.avatar ?? null),
      isStarter: input.isStarter ?? true,
    },
    select: { id: true },
  })

  return prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    select: teamPublicSelect,
  })
}

export async function updatePlayerInTeam(
  tournamentId: string,
  teamId: string,
  playerId: string,
  input: {
    nickname?: string
    realName?: string | null
    role?: string
    country?: string | null
    avatar?: string | null
    isStarter?: boolean
  },
): Promise<TeamPublic> {
  const inTournament = await prisma.team.findFirst({
    where: { id: teamId, tournamentId },
    select: { id: true },
  })
  if (!inTournament) throw new NotFoundError()

  const existing = await prisma.player.findFirst({
    where: { id: playerId, teamId },
    select: { id: true },
  })
  if (!existing) throw new NotFoundError()

  const data: Prisma.PlayerUpdateInput = {}
  if (input.nickname !== undefined) {
    const nick = input.nickname.trim()
    await assertUniquePlayerNickname(teamId, nick, playerId)
    data.nickname = nick
  }
  if (input.realName !== undefined) data.realName = normalizeNullableText(input.realName)
  if (input.role !== undefined) data.role = input.role.trim()
  if (input.country !== undefined) data.country = normalizeNullableText(input.country)
  if (input.avatar !== undefined) data.avatar = normalizeLogo(input.avatar)
  if (input.isStarter !== undefined) data.isStarter = input.isStarter

  await prisma.player.update({
    where: { id: playerId },
    data,
    select: { id: true },
  })

  return prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    select: teamPublicSelect,
  })
}

export async function removePlayerFromTeam(
  tournamentId: string,
  teamId: string,
  playerId: string,
): Promise<TeamPublic> {
  const inTournament = await prisma.team.findFirst({
    where: { id: teamId, tournamentId },
    select: { id: true },
  })
  if (!inTournament) throw new NotFoundError()

  const existing = await prisma.player.findFirst({
    where: { id: playerId, teamId },
    select: { id: true },
  })
  if (!existing) throw new NotFoundError()

  await prisma.player.delete({
    where: { id: playerId },
  })

  return prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    select: teamPublicSelect,
  })
}
