import type { CookieOptions, Response } from 'express'

import { env } from '../config/env.js'

export function refreshCookieName(): string {
  return env.REFRESH_COOKIE_NAME
}

function baseCookieOptions(): CookieOptions {
  const prod = env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: env.REFRESH_COOKIE_MAX_AGE_MS,
  }
}

export function attachRefreshCookie(res: Response, plainRefresh: string): void {
  res.cookie(refreshCookieName(), plainRefresh, baseCookieOptions())
}

export function clearRefreshCookie(res: Response): void {
  const { maxAge: _m, ...opts } = baseCookieOptions()
  res.clearCookie(refreshCookieName(), { ...opts, maxAge: 0 })
}
