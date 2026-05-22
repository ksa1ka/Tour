import { createHash, randomBytes } from 'node:crypto'

const BYTE_LENGTH = 32

export function generateRefreshTokenValue() {
  return randomBytes(BYTE_LENGTH).toString('base64url')
}

export function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
