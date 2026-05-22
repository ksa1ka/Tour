import type { JsonValue } from '@prisma/client/runtime/library'

import { BadRequestError, NotFoundError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'

import {
  BONUS_FOUR_CORRECT,
  BONUS_PERFECT_GRADABLE,
  DEFAULT_FANTASY_PREDICTION_TYPES,
  type FantasyPredictionType,
  FANTASY_PREDICTION_TYPES,
  POINTS_EXACT_SCORE,
  POINTS_FIRST_KILL,
  POINTS_HIGHEST_SCORE,
  POINTS_MVP,
  POINTS_WINNER,
} from './fantasyPredictionConstants.js'

export function parseFantasyActivePredictions(raw: JsonValue | null | undefined): FantasyPredictionType[] {
  if (raw == null) return DEFAULT_FANTASY_PREDICTION_TYPES
  if (!Array.isArray(raw)) return DEFAULT_FANTASY_PREDICTION_TYPES
  const out: FantasyPredictionType[] = []
  for (const x of raw) {
    if (typeof x === 'string' && (FANTASY_PREDICTION_TYPES as readonly string[]).includes(x)) {
      out.push(x as FantasyPredictionType)
    }
  }
  return out.length > 0 ? out : DEFAULT_FANTASY_PREDICTION_TYPES
}

type MatchGradeSelect = {
  id: string
  tournamentId: string
  teamAId: string | null
  teamBId: string | null
  scoreA: number | null
  scoreB: number | null
  winnerId: string | null
  mvpPlayerId: string | null
  firstKillPlayerId: string | null
  round: number
  position: number
}

export function highestScoreTeamFromMatch(m: Pick<MatchGradeSelect, 'teamAId' | 'teamBId' | 'scoreA' | 'scoreB'>): string | null {
  if (m.teamAId == null || m.teamBId == null || m.scoreA == null || m.scoreB == null) return null
  if (m.scoreA === m.scoreB) return null
  return m.scoreA > m.scoreB ? m.teamAId : m.teamBId
}

export function gradePredictionRow(
  active: FantasyPredictionType[],
  match: MatchGradeSelect,
  p: {
    predictedWinnerTeamId: string | null
    predictedMvpPlayerId: string | null
    predictedFirstKillPlayerId: string | null
    predictedHighestScoreTeamId: string | null
    predictedScoreA: number | null
    predictedScoreB: number | null
  },
): {
  ptsWinner: number
  ptsMvp: number
  ptsFirstKill: number
  ptsHighestScore: number
  ptsExactScore: number
  bonusPts: number
} {
  const locked =
    match.winnerId != null || (match.scoreA != null && match.scoreB != null)
  if (!locked) {
    return { ptsWinner: 0, ptsMvp: 0, ptsFirstKill: 0, ptsHighestScore: 0, ptsExactScore: 0, bonusPts: 0 }
  }

  let ptsWinner = 0
  let ptsMvp = 0
  let ptsFirstKill = 0
  let ptsHighestScore = 0
  let ptsExactScore = 0

  if (active.includes('WINNER') && match.winnerId && p.predictedWinnerTeamId === match.winnerId) {
    ptsWinner = POINTS_WINNER
  }
  if (active.includes('MVP') && match.mvpPlayerId && p.predictedMvpPlayerId === match.mvpPlayerId) {
    ptsMvp = POINTS_MVP
  }
  if (active.includes('FIRST_KILL') && match.firstKillPlayerId && p.predictedFirstKillPlayerId === match.firstKillPlayerId) {
    ptsFirstKill = POINTS_FIRST_KILL
  }
  const highTeam = highestScoreTeamFromMatch(match)
  if (active.includes('HIGHEST_SCORE') && highTeam && p.predictedHighestScoreTeamId === highTeam) {
    ptsHighestScore = POINTS_HIGHEST_SCORE
  }
  if (
    active.includes('EXACT_SCORE') &&
    match.scoreA != null &&
    match.scoreB != null &&
    p.predictedScoreA === match.scoreA &&
    p.predictedScoreB === match.scoreB
  ) {
    ptsExactScore = POINTS_EXACT_SCORE
  }

  type Slot = { gradable: boolean; correct: boolean }
  const slots: Slot[] = []

  if (active.includes('WINNER')) {
    slots.push({ gradable: Boolean(match.winnerId), correct: Boolean(match.winnerId && p.predictedWinnerTeamId === match.winnerId) })
  }
  if (active.includes('MVP')) {
    slots.push({
      gradable: Boolean(match.mvpPlayerId),
      correct: Boolean(match.mvpPlayerId && p.predictedMvpPlayerId === match.mvpPlayerId),
    })
  }
  if (active.includes('FIRST_KILL')) {
    slots.push({
      gradable: Boolean(match.firstKillPlayerId),
      correct: Boolean(match.firstKillPlayerId && p.predictedFirstKillPlayerId === match.firstKillPlayerId),
    })
  }
  if (active.includes('HIGHEST_SCORE')) {
    slots.push({
      gradable: highTeam != null,
      correct: Boolean(highTeam && p.predictedHighestScoreTeamId === highTeam),
    })
  }
  if (active.includes('EXACT_SCORE')) {
    const g = match.scoreA != null && match.scoreB != null
    slots.push({
      gradable: g,
      correct: g && p.predictedScoreA === match.scoreA && p.predictedScoreB === match.scoreB,
    })
  }

  const gradable = slots.filter((s) => s.gradable)
  const correctCount = gradable.filter((s) => s.correct).length
  const allGradableCorrect = gradable.length > 0 && gradable.every((s) => s.correct)

  let bonusPts = 0
  if (gradable.length >= 3 && allGradableCorrect) {
    bonusPts = BONUS_PERFECT_GRADABLE
  } else if (correctCount >= 4) {
    bonusPts = BONUS_FOUR_CORRECT
  }

  return { ptsWinner, ptsMvp, ptsFirstKill, ptsHighestScore, ptsExactScore, bonusPts }
}

export async function regradeAllPredictionsForTournament(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { fantasyActivePredictions: true },
  })
  if (!tournament) return

  const active = parseFantasyActivePredictions(tournament.fantasyActivePredictions as JsonValue | null)

  const preds = await prisma.fantasyMatchPrediction.findMany({
    where: { fantasyTeam: { tournamentId } },
    select: {
      id: true,
      predictedWinnerTeamId: true,
      predictedMvpPlayerId: true,
      predictedFirstKillPlayerId: true,
      predictedHighestScoreTeamId: true,
      predictedScoreA: true,
      predictedScoreB: true,
      match: {
        select: {
          id: true,
          tournamentId: true,
          teamAId: true,
          teamBId: true,
          scoreA: true,
          scoreB: true,
          winnerId: true,
          mvpPlayerId: true,
          firstKillPlayerId: true,
          round: true,
          position: true,
        },
      },
    },
  })

  for (const row of preds) {
    const g = gradePredictionRow(active, row.match, {
      predictedWinnerTeamId: row.predictedWinnerTeamId,
      predictedMvpPlayerId: row.predictedMvpPlayerId,
      predictedFirstKillPlayerId: row.predictedFirstKillPlayerId,
      predictedHighestScoreTeamId: row.predictedHighestScoreTeamId,
      predictedScoreA: row.predictedScoreA,
      predictedScoreB: row.predictedScoreB,
    })
    await prisma.fantasyMatchPrediction.update({
      where: { id: row.id },
      data: {
        ptsWinner: g.ptsWinner,
        ptsMvp: g.ptsMvp,
        ptsFirstKill: g.ptsFirstKill,
        ptsHighestScore: g.ptsHighestScore,
        ptsExactScore: g.ptsExactScore,
        bonusPts: g.bonusPts,
      },
    })
  }
}

async function assertMatchPredictable(tournamentId: string, matchId: string) {
  const m = await prisma.match.findFirst({
    where: { id: matchId, tournamentId },
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      winnerId: true,
      scoreA: true,
      scoreB: true,
    },
  })
  if (!m) throw new NotFoundError('Матч не найден')
  if (!m.teamAId || !m.teamBId) throw new BadRequestError('В матче должны быть обе команды для прогноза')
  if (m.winnerId != null || (m.scoreA != null && m.scoreB != null)) {
    throw new BadRequestError('Матч уже завершён — прогнозы закрыты')
  }
  return m
}

async function validatePredictionPayload(
  tournamentId: string,
  matchId: string,
  active: FantasyPredictionType[],
  body: {
    predictedWinnerTeamId?: string | null
    predictedMvpPlayerId?: string | null
    predictedFirstKillPlayerId?: string | null
    predictedHighestScoreTeamId?: string | null
    predictedScoreA?: number | null
    predictedScoreB?: number | null
  },
) {
  const m = await prisma.match.findFirst({
    where: { id: matchId, tournamentId },
    select: { teamAId: true, teamBId: true },
  })
  if (!m?.teamAId || !m.teamBId) throw new BadRequestError('Матч недоступен для прогноза')

  const teamIds = [m.teamAId, m.teamBId]
  const players = await prisma.player.findMany({
    where: { teamId: { in: teamIds } },
    select: { id: true, teamId: true },
  })
  const playerIdSet = new Set(players.map((p) => p.id))

  for (const t of active) {
    if (t === 'WINNER') {
      const v = body.predictedWinnerTeamId
      if (!v || !teamIds.includes(v)) throw new BadRequestError('Укажите победителя из двух команд матча')
    }
    if (t === 'MVP') {
      const v = body.predictedMvpPlayerId
      if (!v || !playerIdSet.has(v)) throw new BadRequestError('MVP должен быть игроком одной из команд матча')
    }
    if (t === 'FIRST_KILL') {
      const v = body.predictedFirstKillPlayerId
      if (!v || !playerIdSet.has(v)) throw new BadRequestError('First kill — игрок из состава команд матча')
    }
    if (t === 'HIGHEST_SCORE') {
      const v = body.predictedHighestScoreTeamId
      if (!v || !teamIds.includes(v)) throw new BadRequestError('Команда с наибольшим счётом должна быть участником матча')
    }
    if (t === 'EXACT_SCORE') {
      if (body.predictedScoreA == null || body.predictedScoreB == null) throw new BadRequestError('Укажите точный счёт (оба значения)')
      if (!Number.isInteger(body.predictedScoreA) || !Number.isInteger(body.predictedScoreB)) {
        throw new BadRequestError('Счёт должен быть целым числом')
      }
      if (body.predictedScoreA < 0 || body.predictedScoreB < 0) throw new BadRequestError('Счёт не может быть отрицательным')
      if (body.predictedScoreA > 999 || body.predictedScoreB > 999) throw new BadRequestError('Счёт слишком большой')
      if (body.predictedScoreA === body.predictedScoreB) throw new BadRequestError('Ничья в счёте недопустима для этого турнира')
    }
  }
}

export async function upsertMyMatchPrediction(
  userId: string,
  tournamentId: string,
  matchId: string,
  body: {
    predictedWinnerTeamId?: string | null
    predictedMvpPlayerId?: string | null
    predictedFirstKillPlayerId?: string | null
    predictedHighestScoreTeamId?: string | null
    predictedScoreA?: number | null
    predictedScoreB?: number | null
  },
) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, status: true, fantasyActivePredictions: true },
  })
  if (!tournament) throw new NotFoundError('Tournament not found')
  if (tournament.status === 'CANCELLED') throw new BadRequestError('Турнир отменён')

  await assertMatchPredictable(tournamentId, matchId)
  const active = parseFantasyActivePredictions(tournament.fantasyActivePredictions as JsonValue | null)
  await validatePredictionPayload(tournamentId, matchId, active, body)

  const ft = await prisma.fantasyTeam.findUnique({
    where: { userId_tournamentId: { userId, tournamentId } },
    select: { id: true },
  })
  if (!ft) throw new BadRequestError('Сначала сохраните состав fantasy-команды для турнира')

  const data = {
    predictedWinnerTeamId: active.includes('WINNER') ? body.predictedWinnerTeamId! : null,
    predictedMvpPlayerId: active.includes('MVP') ? body.predictedMvpPlayerId! : null,
    predictedFirstKillPlayerId: active.includes('FIRST_KILL') ? body.predictedFirstKillPlayerId! : null,
    predictedHighestScoreTeamId: active.includes('HIGHEST_SCORE') ? body.predictedHighestScoreTeamId! : null,
    predictedScoreA: active.includes('EXACT_SCORE') ? body.predictedScoreA! : null,
    predictedScoreB: active.includes('EXACT_SCORE') ? body.predictedScoreB! : null,
  }

  await prisma.fantasyMatchPrediction.upsert({
    where: { fantasyTeamId_matchId: { fantasyTeamId: ft.id, matchId } },
    create: { fantasyTeamId: ft.id, matchId, ...data },
    update: data,
  })
}

export async function getPredictionBoard(userId: string | undefined, tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { fantasyActivePredictions: true },
  })
  if (!tournament) throw new NotFoundError('Tournament not found')

  const active = parseFantasyActivePredictions(tournament.fantasyActivePredictions as JsonValue | null)

  const matches = await prisma.match.findMany({
    where: { tournamentId },
    orderBy: [{ round: 'asc' }, { position: 'asc' }],
    select: {
      id: true,
      round: true,
      position: true,
      teamAId: true,
      teamBId: true,
      scoreA: true,
      scoreB: true,
      winnerId: true,
      mvpPlayerId: true,
      firstKillPlayerId: true,
      teamA: {
        select: {
          id: true,
          name: true,
          logo: true,
          players: { select: { id: true, nickname: true, role: true, avatar: true, teamId: true } },
        },
      },
      teamB: {
        select: {
          id: true,
          name: true,
          logo: true,
          players: { select: { id: true, nickname: true, role: true, avatar: true, teamId: true } },
        },
      },
    },
  })

  let myByMatchId: Record<string, unknown> = {}
  if (userId) {
    const ft = await prisma.fantasyTeam.findUnique({
      where: { userId_tournamentId: { userId, tournamentId } },
      select: {
        matchPredictions: {
          select: {
            matchId: true,
            predictedWinnerTeamId: true,
            predictedMvpPlayerId: true,
            predictedFirstKillPlayerId: true,
            predictedHighestScoreTeamId: true,
            predictedScoreA: true,
            predictedScoreB: true,
            ptsWinner: true,
            ptsMvp: true,
            ptsFirstKill: true,
            ptsHighestScore: true,
            ptsExactScore: true,
            bonusPts: true,
          },
        },
      },
    })
    myByMatchId = Object.fromEntries((ft?.matchPredictions ?? []).map((p) => [p.matchId, p]))
  }

  const board = matches.map((m) => ({
    ...m,
    predictable: Boolean(
      m.teamAId &&
        m.teamBId &&
        m.winnerId == null &&
        !(m.scoreA != null && m.scoreB != null),
    ),
    myPrediction: myByMatchId[m.id] ?? null,
  }))

  return { activePredictionTypes: active, matches: board }
}

export async function getMyPredictionHistory(userId: string, tournamentId: string) {
  const ft = await prisma.fantasyTeam.findUnique({
    where: { userId_tournamentId: { userId, tournamentId } },
    select: { id: true },
  })
  if (!ft) return { entries: [] as const }

  const rows = await prisma.fantasyMatchPrediction.findMany({
    where: { fantasyTeamId: ft.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      updatedAt: true,
      predictedWinnerTeamId: true,
      predictedMvpPlayerId: true,
      predictedFirstKillPlayerId: true,
      predictedHighestScoreTeamId: true,
      predictedScoreA: true,
      predictedScoreB: true,
      ptsWinner: true,
      ptsMvp: true,
      ptsFirstKill: true,
      ptsHighestScore: true,
      ptsExactScore: true,
      bonusPts: true,
      match: {
        select: {
          id: true,
          round: true,
          position: true,
          scoreA: true,
          scoreB: true,
          winnerId: true,
          mvpPlayerId: true,
          firstKillPlayerId: true,
          teamA: { select: { id: true, name: true } },
          teamB: { select: { id: true, name: true } },
        },
      },
    },
  })

  return { entries: rows }
}

export async function getMyPredictionStats(userId: string, tournamentId: string) {
  const ft = await prisma.fantasyTeam.findUnique({
    where: { userId_tournamentId: { userId, tournamentId } },
    select: { id: true },
  })
  if (!ft) {
    return {
      mvpCorrect: 0,
      totalPredictionRows: 0,
      totalPointsFromPredictions: 0,
      totalBonus: 0,
      byKind: {
        WINNER: { correct: 0, total: 0, points: 0 },
        MVP: { correct: 0, total: 0, points: 0 },
        FIRST_KILL: { correct: 0, total: 0, points: 0 },
        HIGHEST_SCORE: { correct: 0, total: 0, points: 0 },
        EXACT_SCORE: { correct: 0, total: 0, points: 0 },
      },
    }
  }

  const preds = await prisma.fantasyMatchPrediction.findMany({
    where: { fantasyTeamId: ft.id },
    select: {
      ptsWinner: true,
      ptsMvp: true,
      ptsFirstKill: true,
      ptsHighestScore: true,
      ptsExactScore: true,
      bonusPts: true,
      match: {
        select: {
          winnerId: true,
          mvpPlayerId: true,
          firstKillPlayerId: true,
          scoreA: true,
          scoreB: true,
          teamAId: true,
          teamBId: true,
        },
      },
    },
  })

  let mvpCorrect = 0
  const byKind = {
    WINNER: { correct: 0, total: 0, points: 0 },
    MVP: { correct: 0, total: 0, points: 0 },
    FIRST_KILL: { correct: 0, total: 0, points: 0 },
    HIGHEST_SCORE: { correct: 0, total: 0, points: 0 },
    EXACT_SCORE: { correct: 0, total: 0, points: 0 },
  }

  let totalBonus = 0
  let totalPredPts = 0

  for (const p of preds) {
    const m = p.match
    const finished = m.winnerId != null || (m.scoreA != null && m.scoreB != null)
    if (!finished) continue

    totalBonus += p.bonusPts
    totalPredPts += p.ptsWinner + p.ptsMvp + p.ptsFirstKill + p.ptsHighestScore + p.ptsExactScore

    byKind.WINNER.total += 1
    byKind.WINNER.points += p.ptsWinner
    if (p.ptsWinner > 0) byKind.WINNER.correct += 1

    byKind.MVP.total += m.mvpPlayerId ? 1 : 0
    byKind.MVP.points += p.ptsMvp
    if (p.ptsMvp > 0) {
      byKind.MVP.correct += 1
      mvpCorrect += 1
    }

    byKind.FIRST_KILL.total += m.firstKillPlayerId ? 1 : 0
    byKind.FIRST_KILL.points += p.ptsFirstKill
    if (p.ptsFirstKill > 0) byKind.FIRST_KILL.correct += 1

    const ht = highestScoreTeamFromMatch(m)
    byKind.HIGHEST_SCORE.total += ht ? 1 : 0
    byKind.HIGHEST_SCORE.points += p.ptsHighestScore
    if (p.ptsHighestScore > 0) byKind.HIGHEST_SCORE.correct += 1

    const exactOk = m.scoreA != null && m.scoreB != null
    byKind.EXACT_SCORE.total += exactOk ? 1 : 0
    byKind.EXACT_SCORE.points += p.ptsExactScore
    if (p.ptsExactScore > 0) byKind.EXACT_SCORE.correct += 1
  }

  return {
    mvpCorrect,
    totalPredictionRows: preds.filter(
      (p) => p.match.winnerId != null || (p.match.scoreA != null && p.match.scoreB != null),
    ).length,
    totalPointsFromPredictions: totalPredPts,
    totalBonus,
    byKind,
  }
}