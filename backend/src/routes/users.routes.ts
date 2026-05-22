import { Router } from 'express'

import * as usersController from '../controllers/usersController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

export const usersRouter = Router()

usersRouter.get('/:userId/profile', requireAuth, usersController.getUserProfile)
