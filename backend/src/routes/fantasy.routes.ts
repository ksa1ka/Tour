import { UserRole } from '@prisma/client'
import { Router } from 'express'

import * as fantasyController from '../controllers/fantasyController.js'
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js'
import { requireAuthWithRoles } from '../middleware/roleMiddleware.js'
import { validateBody, validateParams } from '../middleware/validateRequest.js'
import { fantasyTeamIdParamSchema, tournamentIdParamSchema, tournamentMatchParamsSchema } from '../validation/commonParams.js'
import {
  createFantasyTeamBodySchema,
  replaceFantasySelectionsBodySchema,
  upsertFantasyMatchPredictionBodySchema,
  upsertFantasyTeamBodySchema,
} from '../validation/fantasyValidation.js'

export const tournamentFantasyRouter = Router({ mergeParams: true })

tournamentFantasyRouter.use(validateParams(tournamentIdParamSchema))

tournamentFantasyRouter.get('/predictions/board', optionalAuth, fantasyController.predictionBoard)
tournamentFantasyRouter.get('/predictions/history', requireAuth, fantasyController.predictionHistory)
tournamentFantasyRouter.get('/predictions/stats', requireAuth, fantasyController.predictionStats)
tournamentFantasyRouter.put(
  '/predictions/matches/:matchId',
  requireAuth,
  validateParams(tournamentMatchParamsSchema),
  validateBody(upsertFantasyMatchPredictionBodySchema),
  fantasyController.putMatchPrediction,
)

tournamentFantasyRouter.get('/leaderboard', fantasyController.leaderboard)
tournamentFantasyRouter.get('/stats', fantasyController.stats)
tournamentFantasyRouter.get('/me', requireAuth, fantasyController.me)
tournamentFantasyRouter.put(
  '/team',
  requireAuth,
  validateBody(upsertFantasyTeamBodySchema),
  fantasyController.putTeam,
)
tournamentFantasyRouter.post(
  '/recalculate',
  ...requireAuthWithRoles(UserRole.ADMIN),
  fantasyController.recalculate,
)

/** Корневые маршруты `/fantasy/*` (список команд пользователя, создание, замена состава). */
export const fantasyRouter = Router()

fantasyRouter.get('/teams', requireAuth, fantasyController.listMine)
fantasyRouter.post('/teams', requireAuth, validateBody(createFantasyTeamBodySchema), fantasyController.createFantasy)
fantasyRouter.put(
  '/teams/:fantasyTeamId/selections',
  requireAuth,
  validateParams(fantasyTeamIdParamSchema),
  validateBody(replaceFantasySelectionsBodySchema),
  fantasyController.replaceSelections,
)
