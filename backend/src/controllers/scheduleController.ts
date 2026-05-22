import type { NextFunction, Request, Response } from 'express'

import * as roundRobinGenerationService from '../services/roundRobinGenerationService.js'
import * as standingsService from '../services/standingsService.js'
import * as swissRoundService from '../services/swissRoundService.js'
import {
  emitTournamentBracketUpdated,
  emitTournamentEvent,
  emitTournamentStandingsUpdated,
} from '../socket/tournamentEmit.js'
import type { GenerateRoundRobinBody, GenerateSwissRound1Body } from '../validation/scheduleValidation.js'

function emitScheduleUpdated(tournamentId: string) {
  emitTournamentBracketUpdated(tournamentId)
  emitTournamentStandingsUpdated(tournamentId)
}

export async function generateRoundRobin(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const body = req.body as GenerateRoundRobinBody
    const matches = await roundRobinGenerationService.generateRoundRobin(tournamentId, body.teamIds)
    emitScheduleUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'ROUND_ROBIN_GENERATED',
      message: 'Календарь кругового турнира создан',
      meta: { matchCount: matches.length },
    })
    res.status(201).json({ matches })
  } catch (err) {
    next(err)
  }
}

export async function generateSwissRound1(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const body = (req.body ?? {}) as GenerateSwissRound1Body
    const matches = await swissRoundService.generateSwissRound1(tournamentId, body.teamIds)
    emitScheduleUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'SWISS_ROUND_GENERATED',
      message: 'Сформирован первый тур швейцарки',
      meta: { round: 1, matchCount: matches.length },
    })
    res.status(201).json({ matches })
  } catch (err) {
    next(err)
  }
}

export async function generateSwissNextRound(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const matches = await swissRoundService.generateSwissNextRound(tournamentId)
    const progress = await swissRoundService.getSwissProgress(tournamentId)
    emitScheduleUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'SWISS_ROUND_GENERATED',
      message: `Сформирован тур ${progress.currentRound} швейцарки`,
      meta: { round: progress.currentRound, matchCount: matches.length },
    })
    res.status(201).json({ matches, progress })
  } catch (err) {
    next(err)
  }
}

export async function getStandings(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const standings = await standingsService.getStandings(tournamentId)
    res.json({ standings })
  } catch (err) {
    next(err)
  }
}

export async function getSwissProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const progress = await swissRoundService.getSwissProgress(tournamentId)
    res.json({ progress })
  } catch (err) {
    next(err)
  }
}

