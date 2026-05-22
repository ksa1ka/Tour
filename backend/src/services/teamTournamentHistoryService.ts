import type { Prisma } from '@prisma/client'

import { HttpError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import { teamBracketSlotSelect } from '../prisma/selectFragments.js'

const historyMatchSelect = {
  id: true,
  round: true,
  position: true,
  teamAId: true,
  teamBId: true,
  scoreA: true,
  scoreB: true,
  winnerId: true,
  teamA: { select: teamBracketSlotSelect },
  teamB: { select: teamBracketSlotSelect },
} satisfies Prisma.MatchSelect

type HistoryMatch = Prisma.MatchGetPayload<{ select: typeof historyMatchSelect }>

export type TeamHistoryOutcome = 'win' | 'loss' | 'pending' | 'awaiting_opponent'

export type TeamTournamentHistoryStep = {
  matchId: string
  round: number
  position: number
  opponent: { id: string; name: string; logo: string | null } | null
  scoreOur: number | null
  scoreTheir: number | null
  outcome: TeamHistoryOutcome
}

export type TeamTournamentHistoryResult = {
  team: { id: string; name: string; logo: string | null }
  tournamentId: string
  bracketTotalRounds: number
  steps: TeamTournamentHistoryStep[]
}

function buildSteps(teamId: string, matches: HistoryMatch[]): TeamTournamentHistoryStep[] {
  return matches.map((m) => {
    const isA = m.teamAId === teamId
    const otherId = isA ? m.teamBId : m.teamAId
    const opponentRaw = isA ? m.teamB : m.teamA
    const scoreOur = isA ? m.scoreA : m.scoreB
    const scoreTheir = isA ? m.scoreB : m.scoreA

    let outcome: TeamHistoryOutcome
    if (!otherId) {
      outcome = 'awaiting_opponent'
    } else if (!m.winnerId) {
      outcome = 'pending'
    } else if (m.winnerId === teamId) {
      outcome = 'win'
    } else {
      outcome = 'loss'
    }

    const opponent =
      otherId && !opponentRaw
        ? { id: otherId, name: 'Команда недоступна', logo: null as string | null }
        : opponentRaw
          ? { id: opponentRaw.id, name: opponentRaw.name, logo: opponentRaw.logo }
          : null

    return {
      matchId: m.id,
      round: m.round,
      position: m.position,
      opponent,
      scoreOur,
      scoreTheir,
      outcome,
    }
  })
}

export async function getTeamTournamentHistory(
  tournamentId: string,
  teamId: string,
): Promise<TeamTournamentHistoryResult> {
  const team = await prisma.team.findFirst({
    where: { id: teamId, tournamentId },
    select: { id: true, name: true, logo: true },
  })

  if (!team) {
    throw new HttpError(404, 'Team not found')
  }

  const tournamentExists = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  })
  if (!tournamentExists) {
    throw new HttpError(404, 'Tournament not found')
  }

  const [agg, matches] = await Promise.all([
    prisma.match.aggregate({
      where: { tournamentId },
      _max: { round: true },
    }),
    prisma.match.findMany({
      where: {
        tournamentId,
        OR: [{ teamAId: teamId }, { teamBId: teamId }],
      },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
      select: historyMatchSelect,
    }),
  ])

  const bracketTotalRounds = agg._max.round ?? 0

  return {
    team,
    tournamentId,
    bracketTotalRounds,
    steps: buildSteps(teamId, matches),
  }
}
