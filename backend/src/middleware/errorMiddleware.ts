import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

import { env } from '../config/env.js'
import { HttpError } from '../errors/HttpError.js'

function clientSafeMessage(err: unknown, statusCode: number): string {
  if (env.NODE_ENV !== 'production') {
    return err instanceof Error ? err.message : 'Internal Server Error'
  }
  if (statusCode >= 500) {
    return 'Internal Server Error'
  }
  return err instanceof Error ? err.message : 'Request failed'
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.flatten() })
    return
  }

  if (err instanceof jwt.TokenExpiredError) {
    res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    return
  }

  if (err instanceof jwt.JsonWebTokenError) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.target
      const fields = Array.isArray(target) ? target.join(', ') : typeof target === 'string' ? target : ''
      const hint =
        fields.includes('tournamentId') && fields.includes('name')
          ? 'Team name already exists in this tournament'
          : fields.includes('tournamentId') && fields.includes('captainId')
            ? 'Вы уже зарегистрировали команду на этот турнир'
            : fields.includes('email')
              ? 'Email already registered'
              : 'Resource already exists'
      res.status(409).json({ error: hint })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Not found' })
      return
    }
    console.error('Prisma error:', err.code, err.message)
    res.status(400).json({ error: env.NODE_ENV === 'production' ? 'Database request failed' : err.message })
    return
  }

  if (err instanceof Error && err.message === 'Not found') {
    res.status(404).json({ error: err.message })
    return
  }

  console.error(err)

  const statusCode = 500
  res.status(statusCode).json({
    error: clientSafeMessage(err, statusCode),
  })
}
