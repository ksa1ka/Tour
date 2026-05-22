import type { Prisma } from '@prisma/client'

import { prisma } from '../prisma/client.js'
import { matchWithBracketTeamsSelect } from '../prisma/selectFragments.js'

const matchWithTournamentSelect = {
  ...matchWithBracketTeamsSelect,
  tournament: {
    select: { id: true, title: true, status: true, avatarUrl: true, format: true },
  },
} satisfies Prisma.MatchSelect

/** Все матчи по всем турнирам (для ленты «Матчи и результаты»). */
export async function listAllMatchesWithTournament() {
  return prisma.match.findMany({
    select: matchWithTournamentSelect,
    orderBy: [{ tournament: { updatedAt: 'desc' } }, { round: 'asc' }, { position: 'asc' }],
    take: 2000,
  })
}
