import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { env } from '../config/env.js'
import * as supportController from '../controllers/supportController.js'
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js'
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.js'
import {
  supportFollowUpBodySchema,
  supportMessageBodySchema,
  supportPublicIdParamsSchema,
  supportTicketEmailQuerySchema,
} from '../validation/supportValidation.js'

const forwardedHeaderValidate =
  env.trustProxy === false ? ({ xForwardedForHeader: false } as const) : undefined

const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много обращений. Попробуйте позже.' },
  validate: forwardedHeaderValidate,
})

const followUpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много сообщений. Попробуйте позже.' },
  validate: forwardedHeaderValidate,
})

export const supportRouter = Router()

supportRouter.post(
  '/messages',
  supportLimiter,
  optionalAuth,
  validateBody(supportMessageBodySchema),
  supportController.postSupportMessage,
)

supportRouter.get('/tickets', requireAuth, supportController.listMySupportTickets)

supportRouter.get(
  '/tickets/:publicId',
  optionalAuth,
  validateParams(supportPublicIdParamsSchema),
  validateQuery(supportTicketEmailQuerySchema),
  supportController.getSupportTicket,
)

supportRouter.post(
  '/tickets/:publicId/messages',
  followUpLimiter,
  optionalAuth,
  validateParams(supportPublicIdParamsSchema),
  validateBody(supportFollowUpBodySchema),
  supportController.postSupportFollowUp,
)
