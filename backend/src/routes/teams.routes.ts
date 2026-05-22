import { Router } from 'express'

import * as teamController from '../controllers/teamController.js'
import { validateQuery } from '../middleware/validateRequest.js'
import { listTeamsQuerySchema } from '../validation/teamValidation.js'

export const teamsRouter = Router()

teamsRouter.get('/', validateQuery(listTeamsQuerySchema), teamController.listAll)
