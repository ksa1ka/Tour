import type { NextFunction, Request, Response } from 'express'

import * as captainTeamService from '../services/captainTeamService.js'
import { emitTournamentBracketUpdated, emitTournamentEvent } from '../socket/tournamentEmit.js'
import type {
  RegisterCaptainTeamBody,
  UpdateCaptainTeamBody,
} from '../validation/captainTeamValidation.js'

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    const userRole = req.userRole!
    const tournamentId = req.params.tournamentId as string
    const body = req.body as RegisterCaptainTeamBody

    const team = await captainTeamService.registerCaptainTeam(userId, userRole, tournamentId, body)
    emitTournamentBracketUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'TEAM_CREATED',
      message: `Капитан зарегистрировал команду «${team.name}»`,
      meta: { teamId: team.id },
    })
    res.status(201).json({ team })
  } catch (err) {
    next(err)
  }
}

export async function updateMine(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    const userRole = req.userRole!
    const tournamentId = req.params.tournamentId as string
    const body = req.body as UpdateCaptainTeamBody

    const team = await captainTeamService.updateCaptainTeam(userId, userRole, tournamentId, body)
    emitTournamentBracketUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'TEAM_UPDATED',
      message: `Капитан обновил заявку команды «${team.name}»`,
      meta: { teamId: team.id },
    })
    res.json({ team })
  } catch (err) {
    next(err)
  }
}

export async function withdraw(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    const userRole = req.userRole!
    const tournamentId = req.params.tournamentId as string

    await captainTeamService.withdrawCaptainTeam(userId, userRole, tournamentId)
    emitTournamentBracketUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'TEAM_DELETED',
      message: 'Капитан отозвал заявку команды',
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
