import { Router } from 'express'

import * as authController from '../controllers/authController.js'
import {
  authLoginRegisterLimiter,
  authRefreshLimiter,
} from '../middleware/rateLimiters.js'
import { validateBody } from '../middleware/validateRequest.js'
import { loginBodySchema, registerBodySchema } from '../validation/authValidation.js'

export const authRouter = Router()

authRouter.post(
  '/register',
  authLoginRegisterLimiter,
  validateBody(registerBodySchema),
  authController.register,
)
authRouter.post('/login', authLoginRegisterLimiter, validateBody(loginBodySchema), authController.login)
authRouter.post('/refresh', authRefreshLimiter, authController.refresh)
authRouter.post('/logout', authRefreshLimiter, authController.logout)
