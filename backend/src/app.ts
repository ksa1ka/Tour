import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { mongoSanitizeExpress5 } from './middleware/mongoSanitizeExpress5.js'
import helmet from 'helmet'
import hpp from 'hpp'

import { env } from './config/env.js'
import { buildCorsOptions } from './middleware/corsOptions.js'
import { errorMiddleware } from './middleware/errorMiddleware.js'
import { notFoundMiddleware } from './middleware/notFoundMiddleware.js'
import { apiLimiter } from './middleware/rateLimiters.js'
import { apiRouter } from './routes/index.js'

export const app = express()

if (env.trustProxy !== false) {
  app.set('trust proxy', env.trustProxy)
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
)
app.use(hpp())
app.use(cors(buildCorsOptions()))
app.use(cookieParser())
app.use(express.json({ limit: env.JSON_BODY_LIMIT }))
app.use(mongoSanitizeExpress5())

app.get('/', (_req, res) => {
  res.json({
    name: 'tour-backend',
    health: '/health',
    api: '/api',
  })
})

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api', apiLimiter, apiRouter)

app.use(notFoundMiddleware)
app.use(errorMiddleware)
