import 'express-serve-static-core'

declare module 'express-serve-static-core' {
  interface Request {
    /** Заполняется `validateQuery`: в Express 5 нельзя перезаписать `req.query`. */
    validatedQuery?: unknown
  }
}
