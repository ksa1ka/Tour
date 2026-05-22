import type { NextFunction, Request, Response } from 'express'

import * as fantasyService from '../services/fantasyService.js'
import * as matchService from '../services/matchService.js'
import * as tournamentService from '../services/tournamentService.js'
import {
  emitTournamentBracketUpdated,
  emitTournamentEvent,
  emitTournamentScoresUpdated,
  emitTournamentStandingsUpdated,
} from '../socket/tournamentEmit.js'
import type { UpdateMatchResultBody } from '../validation/matchValidation.js'

export async function updateResult(req: Request, res: Response, next: NextFunction) {
  try {
    const { tournamentId, matchId } = req.params as { tournamentId: string; matchId: string }
    const body = req.body as UpdateMatchResultBody

    const exists = await tournamentService.tournamentExists(tournamentId)
    if (!exists) {
      res.status(404).json({ error: 'Tournament not found' })
      return
    }

    const match = await matchService.updateMatchResult(tournamentId, matchId, body)
    await fantasyService.recalculateForTournament(tournamentId)
    emitTournamentScoresUpdated(tournamentId, matchId)
    emitTournamentBracketUpdated(tournamentId)
    emitTournamentStandingsUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: body.mode === 'clear' ? 'MATCH_CLEARED' : 'MATCH_SCORE',
      message:
        body.mode === 'clear'
          ? 'Сброшен результат матча'
          : `Обновлён счёт матча (раунд ${match.round}, поз. ${match.position})`,
      meta: { matchId },
    })
    res.json({ match })
  } catch (err) {
    next(err)
  }
}
