import type { CorsOptions } from 'cors'

import { env } from '../config/env.js'

export function buildCorsOptions(): CorsOptions {
  if (env.NODE_ENV === 'development') {
    return {
      // Любой localhost-порт (Vite часто уходит на 4002+ если 4001 занят).
      origin: true,
      credentials: true,
      maxAge: 86_400,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }
  }

  return {
    origin: (origin, callback) => {
      if (origin && !env.clientOrigins.includes(origin)) {
        callback(null, false)
        return
      }
      callback(null, true)
    },
    credentials: true,
    maxAge: 86_400,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
}
