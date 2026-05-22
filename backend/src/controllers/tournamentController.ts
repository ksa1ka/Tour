import type { TournamentFormat, TournamentStatus } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'

import * as fantasyService from '../services/fantasyService.js'
import * as tournamentService from '../services/tournamentService.js'
import { emitTournamentBracketUpdated, emitTournamentEvent } from '../socket/tournamentEmit.js'
import type {
  CreateTournamentBody,
  ListTournamentsQuery,
  UpdateTournamentBody,
} from '../validation/tournamentValidation.js'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.validatedQuery as ListTournamentsQuery
    const tournaments = await tournamentService.listTournaments(q.game !== undefined ? { game: q.game } : undefined)
    res.json({ tournaments })
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const tournament = await tournamentService.getTournamentById(req.params.id as string)
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' })
      return
    }
    res.json({ tournament })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const body = req.body as CreateTournamentBody

    const tournament = await tournamentService.createTournament(userId, {
      title: body.title,
      description: body.description,
      avatarUrl: body.avatarUrl,
      game: body.game,
      format: body.format as TournamentFormat,
      formatConfig: body.formatConfig,
      status: body.status as TournamentStatus | undefined,
    })

    res.status(201).json({ tournament })
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const id = req.params.id as string
    const exists = await tournamentService.tournamentExists(id)
    if (!exists) {
      res.status(404).json({ error: 'Tournament not found' })
      return
    }

    const body = req.body as UpdateTournamentBody

    const tournament = await tournamentService.updateTournament(id, {
      title: body.title,
      description: body.description,
      avatarUrl: body.avatarUrl,
      game: body.game,
      format: body.format as TournamentFormat | undefined,
      formatConfig: body.formatConfig,
      status: body.status as TournamentStatus | undefined,
      fantasyActivePredictions: body.fantasyActivePredictions,
    })

    if (body.fantasyActivePredictions !== undefined) {
      await fantasyService.recalculateForTournament(id)
    }

    emitTournamentBracketUpdated(id)
    emitTournamentEvent(id, {
      type: 'TOURNAMENT_UPDATED',
      message: 'Параметры турнира изменены',
      meta: { tournamentId: id },
    })

    res.json({ tournament })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const id = req.params.id as string
    const exists = await tournamentService.tournamentExists(id)
    if (!exists) {
      res.status(404).json({ error: 'Tournament not found' })
      return
    }

    await tournamentService.deleteTournament(id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
