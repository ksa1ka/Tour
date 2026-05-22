import { UserRole } from '@prisma/client'

import { ConflictError, UnauthorizedError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import { signAccessToken } from '../utils/jwt.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { generateRefreshTokenValue, hashRefreshToken } from '../utils/refreshToken.js'

const REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

export type PublicUser = {
  id: string
  email: string
  role: UserRole
  displayName: string | null
  avatarUrl: string | null
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  user: PublicUser
}

async function persistRefreshToken(userId: string, plain: string) {
  const tokenHash = hashRefreshToken(plain)
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS)
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  })
}

async function issueSession(user: PublicUser): Promise<AuthSession> {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  })
  const refreshToken = generateRefreshTokenValue()
  await persistRefreshToken(user.id, refreshToken)
  return { accessToken, refreshToken, user }
}

export async function registerUser(input: {
  email: string
  password: string
  accountRole: Exclude<UserRole, 'ADMIN'>
}): Promise<AuthSession> {
  const email = input.email.trim().toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new ConflictError('Email already registered')
  }

  const password = await hashPassword(input.password)

  const user = await prisma.user.create({
    data: {
      email,
      password,
      role: input.accountRole,
    },
    select: { id: true, email: true, role: true, displayName: true, avatarUrl: true },
  })

  return issueSession(user)
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthSession> {
  const email = input.email.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new UnauthorizedError('Invalid credentials')
  }

  const ok = await verifyPassword(input.password, user.password)
  if (!ok) {
    throw new UnauthorizedError('Invalid credentials')
  }

  const publicUser: PublicUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
  }
  return issueSession(publicUser)
}

export async function rotateRefreshSession(plainRefresh: string): Promise<AuthSession> {
  const tokenHash = hashRefreshToken(plainRefresh)
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: { select: { id: true, email: true, role: true, displayName: true, avatarUrl: true } },
    },
  })

  if (!record || record.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid refresh token')
  }

  await prisma.refreshToken.delete({ where: { id: record.id } })
  return issueSession(record.user)
}

export async function revokeRefreshSession(plainRefresh: string): Promise<void> {
  const tokenHash = hashRefreshToken(plainRefresh)
  await prisma.refreshToken.deleteMany({ where: { tokenHash } })
}
