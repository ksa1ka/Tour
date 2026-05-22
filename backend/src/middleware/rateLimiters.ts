import rateLimit from 'express-rate-limit'

import { env } from '../config/env.js'

/** When `trust proxy` is off, clients may still send `X-Forwarded-For`; skip that validation. */
const forwardedHeaderValidate =
  env.trustProxy === false ? ({ xForwardedForHeader: false } as const) : undefined

/** In development, HMR and many tabs can burn through defaults quickly; keep production caps unchanged. */
const devCapMultiplier = env.NODE_ENV === 'development' ? 50 : 1

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_API_WINDOW_MS,
  max: env.RATE_LIMIT_API_MAX * devCapMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
  validate: forwardedHeaderValidate,
})

export const authLoginRegisterLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX * devCapMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, try again later' },
  validate: forwardedHeaderValidate,
})

export const authRefreshLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_REFRESH_WINDOW_MS,
  max: env.RATE_LIMIT_REFRESH_MAX * devCapMultiplier,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many refresh requests, try again later' },
  validate: forwardedHeaderValidate,
})
