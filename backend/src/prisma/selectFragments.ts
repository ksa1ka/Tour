import type { Prisma } from '@prisma/client'

/** Единый набор полей игрока для публичных API. */
export const playerPublicSelect = {
  id: true,
  nickname: true,
  realName: true,
  avatar: true,
  country: true,
  role: true,
  isStarter: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlayerSelect

const playerListArgs = {
  orderBy: [{ isStarter: 'desc' as const }, { role: 'asc' as const }, { nickname: 'asc' as const }],
  select: playerPublicSelect,
}

/**
 * Команда в слоте сетки / матча: состав и базовые поля без вложенного турнира
 * (турнир уже задан контекстом матча).
 */
export const teamBracketSlotSelect = {
  id: true,
  name: true,
  logo: true,
  players: playerListArgs,
} satisfies Prisma.TeamSelect

/**
 * Полная публичная карточка команды: турнир, состав.
 */
export const teamPublicSelect = {
  id: true,
  name: true,
  logo: true,
  tournamentId: true,
  createdAt: true,
  updatedAt: true,
  tournament: {
    select: { id: true, title: true, avatarUrl: true },
  },
  players: playerListArgs,
} satisfies Prisma.TeamSelect

export type TeamPublic = Prisma.TeamGetPayload<{ select: typeof teamPublicSelect }>

/**
 * Матч сетки с командами в слотах (одинаковая форма для списка, обновления, swap).
 */
export const matchWithBracketTeamsSelect = {
  id: true,
  tournamentId: true,
  round: true,
  position: true,
  teamAId: true,
  teamBId: true,
  scoreA: true,
  scoreB: true,
  winnerId: true,
  mvpPlayerId: true,
  firstKillPlayerId: true,
  nextMatchId: true,
  createdAt: true,
  updatedAt: true,
  teamA: { select: teamBracketSlotSelect },
  teamB: { select: teamBracketSlotSelect },
  winner: { select: teamBracketSlotSelect },
  mvpPlayer: { select: playerPublicSelect },
  firstKillPlayer: { select: playerPublicSelect },
  nextMatch: { select: { id: true, round: true, position: true } },
} satisfies Prisma.MatchSelect

export type MatchWithBracketTeams = Prisma.MatchGetPayload<{ select: typeof matchWithBracketTeamsSelect }>
