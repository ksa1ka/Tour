import { Router } from 'express'

import * as fantasyShopController from '../controllers/fantasyShopController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { validateBody } from '../middleware/validateRequest.js'
import { fantasyShopPurchaseBodySchema } from '../validation/fantasyShopValidation.js'

export const fantasyShopRouter = Router()

fantasyShopRouter.get('/rewards', fantasyShopController.listRewards)
fantasyShopRouter.get('/me', requireAuth, fantasyShopController.me)
fantasyShopRouter.post(
  '/purchase',
  requireAuth,
  validateBody(fantasyShopPurchaseBodySchema),
  fantasyShopController.purchase,
)
