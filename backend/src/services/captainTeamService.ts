import { TournamentStatus, UserRole } from '@prisma/client'

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import { teamPublicSelect, type TeamPublic } from '../prisma/selectFragments.js'
import type { RegisterCaptainTeamBody } from '../validation/captainTeamValidation.js'

const REGISTERABLE_STATUSES: TournamentStatus[] = [TournamentStatus.OPEN, TournamentStatus.REGISTRATION]

type RosterInput = RegisterCaptainTeamBody['players']

function assertRegistrationOpen(status: TournamentStatus) {
  if (!REGISTERABLE_STATUSES.includes(status)) {
    throw new BadRequestError('Регистрация команд на этот турнир сейчас закрыта')
  }
}

function assertPlayerRole(role: UserRole) {
  if (role !== UserRole.PLAYER) {
    throw new ForbiddenError('Только игроки могут регистрировать команду на турнир')
  }
}

function assertUniqueNicknamesInRoster(players: RosterInput) {
  const seen = new Set<string>()
  for (const p of players) {
    const key = p.nickname.trim().toLowerCase()
    if (seen.has(key)) {
      throw new ConflictError('В составе не должно быть одинаковых никнеймов')
    }
    seen.add(key)
  }
}

export async function findCaptainTeam(
  tournamentId: string,
  captainId: string,
): Promise<TeamPublic | null> {
  return prisma.team.findFirst({
    where: { tournamentId, captainId },
    select: teamPublicSelect,
  })
}

export async function registerCaptainTeam(
  captainId: string,
  userRole: UserRole,
  tournamentId: string,
  input: RegisterCaptainTeamBody,
): Promise<TeamPublic> {
  assertPlayerRole(userRole)
  assertUniqueNicknamesInRoster(input.players)

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, status: true },
  })
  if (!tournament) throw new NotFoundError('Tournament not found')
  assertRegistrationOpen(tournament.status)

  const existing = await prisma.team.findFirst({
    where: { tournamentId, captainId },
    select: { id: true },
  })
  if (existing) {
    throw new ConflictError('Вы уже зарегистрировали команду на этот турнир')
  }

  const trimmedName = input.name.trim()
  const nameClash = await prisma.team.findFirst({
    where: { tournamentId, name: trimmedName },
    select: { id: true },
  })
  if (nameClash) {
    throw new ConflictError('В этом турнире уже есть команда с таким названием')
  }

  return prisma.team.create({
    data: {
      name: trimmedName,
      logo: input.logo ?? null,
      tournamentId,
      captainId,
      players: {
        create: input.players.map((p) => ({
          nickname: p.nickname.trim(),
          realName: p.realName ?? null,
          role: p.role.trim(),
          country: p.country ?? null,
          avatar: p.avatar ?? null,
          isStarter: p.isStarter ?? true,
        })),
      },
    },
    select: teamPublicSelect,
  })
}

export async function updateCaptainTeam(
  captainId: string,
  userRole: UserRole,
  tournamentId: string,
  input: RegisterCaptainTeamBody,
): Promise<TeamPublic> {
  assertPlayerRole(userRole)
  assertUniqueNicknamesInRoster(input.players)

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  })
  if (!tournament) throw new NotFoundError('Tournament not found')
  assertRegistrationOpen(tournament.status)

  const team = await prisma.team.findFirst({
    where: { tournamentId, captainId },
    select: { id: true, name: true },
  })
  if (!team) throw new NotFoundError('Ваша команда на этом турнире не найдена')

  const trimmedName = input.name.trim()
  if (trimmedName.toLowerCase() !== team.name.trim().toLowerCase()) {
    const nameClash = await prisma.team.findFirst({
      where: { tournamentId, name: trimmedName, NOT: { id: team.id } },
      select: { id: true },
    })
    if (nameClash) {
      throw new ConflictError('В этом турнире уже есть команда с таким названием')
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.player.deleteMany({ where: { teamId: team.id } })
    await tx.team.update({
      where: { id: team.id },
      data: {
        name: trimmedName,
        logo: input.logo ?? null,
        players: {
          create: input.players.map((p) => ({
            nickname: p.nickname.trim(),
            realName: p.realName ?? null,
            role: p.role.trim(),
            country: p.country ?? null,
            avatar: p.avatar ?? null,
            isStarter: p.isStarter ?? true,
          })),
        },
      },
    })
    return tx.team.findUniqueOrThrow({
      where: { id: team.id },
      select: teamPublicSelect,
    })
  })
}

export async function withdrawCaptainTeam(
  captainId: string,
  userRole: UserRole,
  tournamentId: string,
): Promise<void> {
  assertPlayerRole(userRole)

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  })
  if (!tournament) throw new NotFoundError('Tournament not found')
  assertRegistrationOpen(tournament.status)

  const team = await prisma.team.findFirst({
    where: { tournamentId, captainId },
    select: { id: true },
  })
  if (!team) throw new NotFoundError('Ваша команда на этом турнире не найдена')

  await prisma.team.delete({ where: { id: team.id } })
}
