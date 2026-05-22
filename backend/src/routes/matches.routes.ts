import { Router } from 'express'

import * as allMatchesController from '../controllers/allMatchesController.js'

export const matchesRouter = Router()

matchesRouter.get('/feed', allMatchesController.listFeed)
