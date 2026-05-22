import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { verifyAccessToken } from '../utils/jwt.js'
import { prisma } from '../prisma/client.js'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = header.slice('Bearer '.length)

  try {
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    })
    if (!user) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    req.userId = user.id
    req.userEmail = user.email
    req.userRole = user.role
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
      return
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
    next(err)
  }
}

/** Optional auth: sets `req.userId` when a valid Bearer token is present */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next()
    return
  }

  const token = header.slice('Bearer '.length)

  try {
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    })
    if (user) {
      req.userId = user.id
      req.userEmail = user.email
      req.userRole = user.role
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next()
}
