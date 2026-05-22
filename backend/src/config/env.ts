import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

/** Загружаем именно `backend/.env`, чтобы SQLite и порт не зависели от `process.cwd()`. */
const backendEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env')
loadEnv({ path: backendEnvPath })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  /** Access JWT lifetime, e.g. `15m`, `1h` (jsonwebtoken `expiresIn`) */
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  /**
   * Allowed browser origins (CORS). Comma-separated for multiple values
   * (e.g. production app + Vercel preview URL).
   */
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  /** httpOnly refresh cookie name */
  REFRESH_COOKIE_NAME: z.string().min(1).default('tour_rt'),
  /** Refresh cookie Max-Age in milliseconds (default 30 days) */
  REFRESH_COOKIE_MAX_AGE_MS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60 * 1000),
  /** Expected JWT `aud` claim (access tokens). */
  JWT_AUDIENCE: z.string().min(1).default('tour-api'),
  /**
   * Behind reverse proxy: `true` (trust first hop), `false`, or a number of hops.
   * @see https://expressjs.com/en/guide/behind-proxies.html
   */
  TRUST_PROXY: z.string().default('false'),
  /** Max JSON body size (bytes string), e.g. `256kb` */
  JSON_BODY_LIMIT: z.string().default('256kb'),
  RATE_LIMIT_API_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_API_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(25),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_REFRESH_MAX: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_REFRESH_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

const data = parsed.data

function parseTrustProxy(value: string): boolean | number | string {
  const v = value.trim()
  if (v === 'false' || v === '') return false
  if (v === 'true') return 1
  const n = Number(v)
  if (!Number.isNaN(n) && n >= 1) return n
  return v
}

export const env = {
  ...data,
  clientOrigins: data.CLIENT_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  trustProxy: parseTrustProxy(data.TRUST_PROXY),
}
