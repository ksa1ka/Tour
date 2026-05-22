import type { NextFunction, Request, Response } from 'express'
import mongoSanitize from 'express-mongo-sanitize'

type SanitizeOptions = NonNullable<Parameters<typeof mongoSanitize>[0]>

/**
 * express-mongo-sanitize assigns back to req.query, which throws on Express 5
 * (req.query is getter-only). Sanitize mutable objects in place instead.
 */
export function mongoSanitizeExpress5(options?: SanitizeOptions) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const opts = options ?? {}
    if (req.body && typeof req.body === 'object') {
      mongoSanitize.sanitize(req.body as Record<string, unknown>, opts)
    }
    if (req.params && typeof req.params === 'object') {
      mongoSanitize.sanitize(req.params as Record<string, unknown>, opts)
    }
    if (req.headers && typeof req.headers === 'object') {
      mongoSanitize.sanitize(req.headers as Record<string, unknown>, opts)
    }
    if (req.query && typeof req.query === 'object') {
      mongoSanitize.sanitize(req.query as Record<string, unknown>, opts)
    }
    next()
  }
}
