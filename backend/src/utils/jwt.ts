import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { z } from 'zod'

import { UserRole } from '@prisma/client'

import { env } from '../config/env.js'

const ISSUER = 'tour-platform'

const accessTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  role: z.enum([UserRole.ADMIN, UserRole.VIEWER, UserRole.PLAYER]),
})

export type AccessTokenPayload = z.infer<typeof accessTokenClaimsSchema>

export function signAccessToken(payload: AccessTokenPayload) {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: ISSUER,
    audience: env.JWT_AUDIENCE,
  }
  return jwt.sign(payload, env.JWT_SECRET, options)
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: env.JWT_AUDIENCE,
  })

  if (typeof decoded === 'string') {
    throw new jwt.JsonWebTokenError('Invalid token format')
  }

  const parsed = accessTokenClaimsSchema.safeParse(decoded)
  if (!parsed.success) {
    throw new jwt.JsonWebTokenError('Invalid token payload')
  }

  return parsed.data
}
