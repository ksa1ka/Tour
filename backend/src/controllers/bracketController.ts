import type { NextFunction, Request, Response } from 'express'

import * as bracketGenerationService from '../services/bracketGenerationService.js'
import * as fantasyService from '../services/fantasyService.js'
import * as matchPropagationService from '../services/matchPropagationService.js'
import type { ApplyMatchWinnerInput } from '../services/matchPropagationService.js'
import {
  emitTournamentBracketUpdated,
  emitTournamentEvent,
  emitTournamentScoresUpdated,
} from '../socket/tournamentEmit.js'
import * as bracketTeamSwapService from '../services/bracketTeamSwapService.js'
import type { GenerateBracketBody, SetMatchWinnerBody, SwapBracketTeamSlotsBody } from '../validation/bracketValidation.js'

export async function generateBracket(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const body = req.body as GenerateBracketBody
    const matches = await bracketGenerationService.generateSingleEliminationBracket(tournamentId, body.teamIds)
    emitTournamentBracketUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'BRACKET_GENERATED',
      message: 'Сетка турнира пересоздана',
      meta: { matchCount: matches.length },
    })
    res.status(201).json({ matches })
  } catch (err) {
    next(err)
  }
}

export async function listMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const matches = await bracketGenerationService.listBracketMatches(tournamentId)
    res.json({ matches })
  } catch (err) {
    next(err)
  }
}

export async function swapTeamSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const body = req.body as SwapBracketTeamSlotsBody
    const matches = await bracketTeamSwapService.swapBracketTeamSlots(tournamentId, {
      fromMatchId: body.fromMatchId,
      fromSide: body.fromSide,
      toMatchId: body.toMatchId,
      toSide: body.toSide,
    })
    await fantasyService.recalculateForTournament(tournamentId)
    emitTournamentBracketUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'BRACKET_TEAM_SLOTS_SWAPPED',
      message: 'Обновлён посев первого раунда',
      meta: { fromMatchId: body.fromMatchId, toMatchId: body.toMatchId },
    })
    res.json({ matches })
  } catch (err) {
    next(err)
  }
}

export async function setMatchWinner(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const matchId = req.params.matchId as string
    const body = req.body as SetMatchWinnerBody
    const match = await matchPropagationService.applyMatchWinner(tournamentId, matchId, body as ApplyMatchWinnerInput)
    await fantasyService.recalculateForTournament(tournamentId)
    emitTournamentScoresUpdated(tournamentId, matchId)
    emitTournamentBracketUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'MATCH_WINNER',
      message: `Зафиксирован победитель матча (раунд ${match.round})`,
      meta: { matchId },
    })
    res.json({ match })
  } catch (err) {
    next(err)
  }
}
