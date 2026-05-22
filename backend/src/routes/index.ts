import { Router } from 'express'

import { adminRouter } from './admin.routes.js'
import { authRouter } from './auth.routes.js'
import { fantasyShopRouter } from './fantasyShop.routes.js'
import { fantasyRouter } from './fantasy.routes.js'
import { matchesRouter } from './matches.routes.js'
import { profileRouter } from './profile.routes.js'
import { supportRouter } from './support.routes.js'
import { teamsRouter } from './teams.routes.js'
import { usersRouter } from './users.routes.js'
import { tournamentsRouter } from './tournaments.routes.js'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/profile', profileRouter)
apiRouter.use('/users', usersRouter)
apiRouter.use('/teams', teamsRouter)
apiRouter.use('/matches', matchesRouter)
apiRouter.use('/tournaments', tournamentsRouter)
apiRouter.use('/fantasy', fantasyRouter)
apiRouter.use('/fantasy-shop', fantasyShopRouter)
apiRouter.use('/support', supportRouter)
