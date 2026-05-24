import { UserRole } from '@prisma/client'
import { Router } from 'express'

import * as adminController from '../controllers/adminController.js'
import * as adminSupportController from '../controllers/adminSupportController.js'
import { requireAuthWithRoles } from '../middleware/roleMiddleware.js'
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.js'
import {
  adminShopRewardIdParamsSchema,
  adminUpdateShopRewardImageBodySchema,
} from '../validation/adminRewardValidation.js'
import {
  adminUpdateUserRoleBodySchema,
  adminUserIdParamsSchema,
} from '../validation/adminUserValidation.js'
import {
  adminSupportListQuerySchema,
  adminSupportReplyBodySchema,
  adminSupportStatusBodySchema,
  adminSupportTicketIdParamsSchema,
} from '../validation/supportValidation.js'

export const adminRouter = Router()

adminRouter.get('/stats', ...requireAuthWithRoles(UserRole.ADMIN), adminController.getDashboardStats)
adminRouter.get('/users', ...requireAuthWithRoles(UserRole.ADMIN), adminController.listUsers)
adminRouter.patch(
  '/users/:userId/role',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(adminUserIdParamsSchema),
  validateBody(adminUpdateUserRoleBodySchema),
  adminController.updateUserRole,
)
adminRouter.get('/fantasy-teams', ...requireAuthWithRoles(UserRole.ADMIN), adminController.listFantasyTeams)
adminRouter.get('/shop-purchases', ...requireAuthWithRoles(UserRole.ADMIN), adminController.listRewardPurchases)
adminRouter.get('/shop-rewards', ...requireAuthWithRoles(UserRole.ADMIN), adminController.listShopRewards)
adminRouter.patch(
  '/shop-rewards/:rewardId',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(adminShopRewardIdParamsSchema),
  validateBody(adminUpdateShopRewardImageBodySchema),
  adminController.updateShopRewardImage,
)

adminRouter.get(
  '/support/tickets',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateQuery(adminSupportListQuerySchema),
  adminSupportController.listSupportTickets,
)
adminRouter.get(
  '/support/tickets/:ticketId',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(adminSupportTicketIdParamsSchema),
  adminSupportController.getSupportTicket,
)
adminRouter.post(
  '/support/tickets/:ticketId/replies',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(adminSupportTicketIdParamsSchema),
  validateBody(adminSupportReplyBodySchema),
  adminSupportController.postSupportReply,
)
adminRouter.patch(
  '/support/tickets/:ticketId',
  ...requireAuthWithRoles(UserRole.ADMIN),
  validateParams(adminSupportTicketIdParamsSchema),
  validateBody(adminSupportStatusBodySchema),
  adminSupportController.patchSupportTicketStatus,
)
