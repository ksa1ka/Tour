import { UserRole } from '@prisma/client'
import { Router } from 'express'

import * as bracketController from '../controllers/bracketController.js'
import * as matchController from '../controllers/matchController.js'
import * as scheduleController from '../controllers/scheduleController.js'
import * as teamController from '../controllers/teamController.js'
import * as tournamentController from '../controllers/tournamentController.js'
import * as captainTeamController from '../controllers/captainTeamController.js'
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js'
import { requireAuthWithRoles } from '../middleware/roleMiddleware.js'
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.js'
import { tournamentFantasyRouter } from './fantasy.routes.js'
import {
  generateBracketBodySchema,
  setMatchWinnerBodySchema,
  swapBracketTeamSlotsBodySchema,
} from '../validation/bracketValidation.js'
import {
  generateRoundRobinBodySchema,
  generateSwissRound1BodySchema,
} from '../validation/scheduleValidation.js'
import {
  tournamentByIdParamSchema,
  tournamentIdParamSchema,
  tournamentMatchParamsSchema,
  tournamentTeamParamsSchema,
} from '../validation/commonParams.js'
import { updateMatchResultBodySchema } from '../validation/matchValidation.js'
import {
  createPlayerBodySchema,
  tournamentTeamPlayerParamsSchema,
  updatePlayerBodySchema,
} from '../validation/playerValidation.js'
import {
  registerCaptainTeamBodySchema,
  updateCaptainTeamBodySchema,
} from '../validation/captainTeamValidation.js'
import { createTeamBodySchema, updateTeamBodySchema } from '../validation/teamValidation.js'
import {
  createTournamentBodySchema,
  listTournamentsQuerySchema,
  updateTournamentBodySchema,
} from '../validation/tournamentValidation.js'

const tournamentTeamsRouter = Router({ mergeParams: true })

tournamentTeamsRouter.get('/', validateParams(tournamentIdParamSchema), teamController.listByTournament)
tournamentTeamsRouter.post(
  '/',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentIdParamSchema),
  validateBody(createTeamBodySchema),
  teamController.create,
)
tournamentTeamsRouter.patch(
  '/:teamId',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentTeamParamsSchema),
  validateBody(updateTeamBodySchema),
  teamController.update,
)
tournamentTeamsRouter.delete(
  '/:teamId',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentTeamParamsSchema),
  teamController.remove,
)

tournamentTeamsRouter.post(
  '/:teamId/players',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentTeamParamsSchema),
  validateBody(createPlayerBodySchema),
  teamController.addPlayer,
)
tournamentTeamsRouter.patch(
  '/:teamId/players/:playerId',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentTeamPlayerParamsSchema),
  validateBody(updatePlayerBodySchema),
  teamController.updatePlayer,
)
tournamentTeamsRouter.delete(
  '/:teamId/players/:playerId',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentTeamPlayerParamsSchema),
  teamController.removePlayer,
)

tournamentTeamsRouter.get(
  '/:teamId/history',
  validateParams(tournamentTeamParamsSchema),
  teamController.getTournamentHistory,
)

const tournamentBracketRouter = Router({ mergeParams: true })

tournamentBracketRouter.use(validateParams(tournamentIdParamSchema))

tournamentBracketRouter.get('/matches', bracketController.listMatches)
tournamentBracketRouter.post(
  '/generate',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateBody(generateBracketBodySchema),
  bracketController.generateBracket,
)
tournamentBracketRouter.patch(
  '/matches/:matchId',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentMatchParamsSchema),
  validateBody(setMatchWinnerBodySchema),
  bracketController.setMatchWinner,
)
tournamentBracketRouter.patch(
  '/team-slots/swap',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateBody(swapBracketTeamSlotsBodySchema),
  bracketController.swapTeamSlots,
)

export const tournamentsRouter = Router()

tournamentsRouter.use('/:tournamentId/bracket', tournamentBracketRouter)
tournamentsRouter.use('/:tournamentId/teams', tournamentTeamsRouter)
tournamentsRouter.use('/:tournamentId/fantasy', tournamentFantasyRouter)

tournamentsRouter.post(
  '/:tournamentId/teams/register',
  requireAuth,
  validateParams(tournamentIdParamSchema),
  validateBody(registerCaptainTeamBodySchema),
  captainTeamController.register,
)
tournamentsRouter.patch(
  '/:tournamentId/teams/my',
  requireAuth,
  validateParams(tournamentIdParamSchema),
  validateBody(updateCaptainTeamBodySchema),
  captainTeamController.updateMine,
)
tournamentsRouter.delete(
  '/:tournamentId/teams/my',
  requireAuth,
  validateParams(tournamentIdParamSchema),
  captainTeamController.withdraw,
)

tournamentsRouter.get('/:tournamentId/matches', validateParams(tournamentIdParamSchema), bracketController.listMatches)
tournamentsRouter.get('/:tournamentId/standings', validateParams(tournamentIdParamSchema), scheduleController.getStandings)
tournamentsRouter.get(
  '/:tournamentId/swiss/progress',
  validateParams(tournamentIdParamSchema),
  scheduleController.getSwissProgress,
)
tournamentsRouter.post(
  '/:tournamentId/round-robin/generate',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentIdParamSchema),
  validateBody(generateRoundRobinBodySchema),
  scheduleController.generateRoundRobin,
)
tournamentsRouter.post(
  '/:tournamentId/swiss/generate-round',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentIdParamSchema),
  validateBody(generateSwissRound1BodySchema),
  scheduleController.generateSwissRound1,
)
tournamentsRouter.post(
  '/:tournamentId/swiss/next-round',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentIdParamSchema),
  scheduleController.generateSwissNextRound,
)
tournamentsRouter.patch(
  '/:tournamentId/matches/:matchId',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentMatchParamsSchema),
  validateBody(updateMatchResultBodySchema),
  matchController.updateResult,
)

tournamentsRouter.get('/', validateQuery(listTournamentsQuerySchema), tournamentController.list)
tournamentsRouter.post(
  '/',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateBody(createTournamentBodySchema),
  tournamentController.create,
)
tournamentsRouter.get(
  '/:id',
  optionalAuth,
  validateParams(tournamentByIdParamSchema),
  tournamentController.getById,
)
tournamentsRouter.patch(
  '/:id',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentByIdParamSchema),
  validateBody(updateTournamentBodySchema),
  tournamentController.update,
)
tournamentsRouter.delete(
  '/:id',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(tournamentByIdParamSchema),
  tournamentController.remove,
)
