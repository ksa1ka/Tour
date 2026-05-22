import type { NextFunction, Request, Response } from 'express'

import * as fantasyService from '../services/fantasyService.js'
import * as fantasyPredictionService from '../services/fantasyPredictionService.js'
import type {
  CreateFantasyTeamBody,
  ReplaceFantasySelectionsBody,
  UpsertFantasyMatchPredictionBody,
  UpsertFantasyTeamBody,
} from '../validation/fantasyValidation.js'

function parsePagination(req: Request): { limit: number; offset: number } {
  const limitRaw = Number(req.query.limit)
  const offsetRaw = Number(req.query.offset)
  const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, Math.floor(limitRaw))) : 50
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0
  return { limit, offset }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    const fantasyTeams = await fantasyService.listFantasyTeamsForUser(userId)
    res.json({ fantasyTeams })
  } catch (err) {
    next(err)
  }
}

export async function createFantasy(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    const body = req.body as CreateFantasyTeamBody
    const fantasyTeam = await fantasyService.createFantasyTeam(userId, {
      tournamentId: body.tournamentId,
      name: body.name,
    })
    res.status(201).json({ fantasyTeam })
  } catch (err) {
    next(err)
  }
}

export async function replaceSelections(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    const fantasyTeamId = req.params.fantasyTeamId as string
    const body = req.body as ReplaceFantasySelectionsBody

    const fantasyTeam = await fantasyService.replaceFantasySelections(userId, fantasyTeamId, body.teamIds)
    res.json({ fantasyTeam })
  } catch (err) {
    next(err)
  }
}

export async function leaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const { limit, offset } = parsePagination(req)
    const [entries, total] = await Promise.all([
      fantasyService.getLeaderboard(tournamentId, limit, offset),
      fantasyService.countFantasyTeams(tournamentId),
    ])
    res.json({ leaderboard: entries, total, limit, offset })
  } catch (err) {
    next(err)
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const tournamentId = req.params.tournamentId as string
    const fantasyTeam = await fantasyService.getMyFantasyTeam(userId, tournamentId)
    res.json({ fantasyTeam })
  } catch (err) {
    next(err)
  }
}

export async function putTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const tournamentId = req.params.tournamentId as string
    const body = req.body as UpsertFantasyTeamBody
    const fantasyTeam = await fantasyService.upsertMyFantasyTeam(userId, tournamentId, {
      name: body.name,
      teamIds: body.teamIds,
    })
    res.json({ fantasyTeam })
  } catch (err) {
    next(err)
  }
}

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const teams = await fantasyService.getTournamentPickStats(tournamentId)
    res.json({ teams })
  } catch (err) {
    next(err)
  }
}

export async function recalculate(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    await fantasyService.recalculateForTournament(tournamentId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function predictionBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const userId = req.userId as string | undefined
    const board = await fantasyPredictionService.getPredictionBoard(userId, tournamentId)
    res.json(board)
  } catch (err) {
    next(err)
  }
}

export async function predictionHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const tournamentId = req.params.tournamentId as string
    const data = await fantasyPredictionService.getMyPredictionHistory(userId, tournamentId)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function predictionStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const tournamentId = req.params.tournamentId as string
    const data = await fantasyPredictionService.getMyPredictionStats(userId, tournamentId)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function putMatchPrediction(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const tournamentId = req.params.tournamentId as string
    const matchId = req.params.matchId as string
    const body = req.body as UpsertFantasyMatchPredictionBody
    await fantasyPredictionService.upsertMyMatchPrediction(userId, tournamentId, matchId, body)
    await fantasyService.recalculateForTournament(tournamentId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
