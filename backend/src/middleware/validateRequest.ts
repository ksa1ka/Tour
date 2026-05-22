import type { NextFunction, Request, Response } from 'express'
import type { z } from 'zod'
import { ZodError } from 'zod'

function sendZodError(next: NextFunction, error: ZodError) {
  next(error)
}

/** Парсит JSON body и заменяет `req.body` на результат схемы (типобезопасность — через явный cast в контроллере). */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      sendZodError(next, result.error)
      return
    }
    req.body = result.data
    next()
  }
}

/** Валидирует `req.params` и подставляет нормализованные значения обратно в `req.params`. */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      sendZodError(next, result.error)
      return
    }
    Object.assign(req.params, result.data)
    next()
  }
}

/** Валидирует строковые query-параметры. */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      sendZodError(next, result.error)
      return
    }
    // Express 5: `req.query` is getter-only (re-parsed from URL each read); cannot assign.
    req.validatedQuery = result.data
    next()
  }
}
