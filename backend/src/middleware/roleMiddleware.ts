import type { NextFunction, Request, RequestHandler, Response } from 'express'

import type { UserRole } from '@prisma/client'

import { requireAuth } from './authMiddleware.js'

export function requireRoles(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const role = req.userRole
    if (!role || !allowed.includes(role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }
    next()
  }
}

/** Enforces Bearer JWT then role; avoids mis-ordered middleware chains */
export function requireAuthWithRoles(...allowed: UserRole[]): RequestHandler[] {
  return [requireAuth, requireRoles(...allowed)]
}
