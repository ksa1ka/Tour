import type { NextFunction, Request, Response } from 'express'

import * as teamService from '../services/teamService.js'
import * as teamTournamentHistoryService from '../services/teamTournamentHistoryService.js'
import * as tournamentService from '../services/tournamentService.js'
import { emitTournamentBracketUpdated, emitTournamentEvent } from '../socket/tournamentEmit.js'
import type { CreatePlayerBody, UpdatePlayerBody } from '../validation/playerValidation.js'
import type { CreateTeamBody, ListTeamsQuery, UpdateTeamBody } from '../validation/teamValidation.js'

export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.validatedQuery as ListTeamsQuery
    const teams = await teamService.listTeams(q.tournamentId ? { tournamentId: q.tournamentId } : undefined)
    res.json({ teams })
  } catch (err) {
    next(err)
  }
}

export async function listByTournament(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const exists = await tournamentService.tournamentExists(tournamentId)
    if (!exists) {
      res.status(404).json({ error: 'Tournament not found' })
      return
    }
    const teams = await teamService.listTeamsByTournament(tournamentId)
    res.json({ teams })
  } catch (err) {
    next(err)
  }
}

export async function getTournamentHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const teamId = req.params.teamId as string
    const history = await teamTournamentHistoryService.getTeamTournamentHistory(tournamentId, teamId)
    res.json(history)
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const exists = await tournamentService.tournamentExists(tournamentId)
    if (!exists) {
      res.status(404).json({ error: 'Tournament not found' })
      return
    }

    const body = req.body as CreateTeamBody
    const team = await teamService.createTeam(tournamentId, {
      name: body.name,
      logo: body.logo,
    })
    emitTournamentBracketUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'TEAM_CREATED',
      message: `Добавлена команда «${team.name}»`,
      meta: { teamId: team.id },
    })
    res.status(201).json({ team })
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const teamId = req.params.teamId as string

    const existing = await teamService.getTeamInTournament(tournamentId, teamId)
    if (!existing) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    const body = req.body as UpdateTeamBody
    const team = await teamService.updateTeam(tournamentId, teamId, {
      name: body.name,
      logo: body.logo,
    })
    emitTournamentBracketUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'TEAM_UPDATED',
      message: `Обновлена команда «${team.name}»`,
      meta: { teamId: team.id },
    })
    res.json({ team })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const teamId = req.params.teamId as string

    const existing = await teamService.getTeamInTournament(tournamentId, teamId)
    if (!existing) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    await teamService.deleteTeam(tournamentId, teamId)
    emitTournamentBracketUpdated(tournamentId)
    emitTournamentEvent(tournamentId, {
      type: 'TEAM_DELETED',
      message: 'Команда удалена',
      meta: { teamId },
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function addPlayer(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const teamId = req.params.teamId as string

    const existing = await teamService.getTeamInTournament(tournamentId, teamId)
    if (!existing) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    const body = req.body as CreatePlayerBody
    const team = await teamService.addPlayerToTeam(tournamentId, teamId, {
      nickname: body.nickname,
      realName: body.realName ?? null,
      role: body.role,
      country: body.country ?? null,
      avatar: body.avatar ?? null,
      isStarter: body.isStarter,
    })

    emitTournamentEvent(tournamentId, {
      type: 'TEAM_UPDATED',
      message: `Обновлён состав команды «${team.name}»`,
      meta: { teamId: team.id },
    })
    res.status(201).json({ team })
  } catch (err) {
    next(err)
  }
}

export async function updatePlayer(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const teamId = req.params.teamId as string
    const playerId = req.params.playerId as string

    const existing = await teamService.getTeamInTournament(tournamentId, teamId)
    if (!existing) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    const body = req.body as UpdatePlayerBody
    const team = await teamService.updatePlayerInTeam(tournamentId, teamId, playerId, body)
    emitTournamentEvent(tournamentId, {
      type: 'TEAM_UPDATED',
      message: `Обновлён состав команды «${team.name}»`,
      meta: { teamId: team.id, playerId },
    })
    res.json({ team })
  } catch (err) {
    next(err)
  }
}

export async function removePlayer(req: Request, res: Response, next: NextFunction) {
  try {
    const tournamentId = req.params.tournamentId as string
    const teamId = req.params.teamId as string
    const playerId = req.params.playerId as string

    const existing = await teamService.getTeamInTournament(tournamentId, teamId)
    if (!existing) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    const team = await teamService.removePlayerFromTeam(tournamentId, teamId, playerId)
    emitTournamentEvent(tournamentId, {
      type: 'TEAM_UPDATED',
      message: `Обновлён состав команды «${team.name}»`,
      meta: { teamId: team.id, playerId },
    })
    res.json({ team })
  } catch (err) {
    next(err)
  }
}
