import { Router } from 'express'

import * as profileController from '../controllers/profileController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

export const profileRouter = Router()

profileRouter.get('/', requireAuth, profileController.getMine)
profileRouter.patch('/', requireAuth, profileController.patchMine)
