import type { Request, Response } from 'express'

import * as authService from '../services/authService.js'
import type { AuthSession } from '../services/authService.js'
import { attachRefreshCookie, clearRefreshCookie, refreshCookieName } from '../utils/refreshCookie.js'
import type { LoginBody, RegisterBody } from '../validation/authValidation.js'

function sendAuthJson(res: Response, session: AuthSession, statusCode: number) {
  attachRefreshCookie(res, session.refreshToken)
  res.status(statusCode).json({ accessToken: session.accessToken, user: session.user })
}

export async function register(req: Request, res: Response) {
  const body = req.body as RegisterBody
  const result = await authService.registerUser(body)
  sendAuthJson(res, result, 201)
}

export async function login(req: Request, res: Response) {
  const body = req.body as LoginBody
  const result = await authService.loginUser(body)
  sendAuthJson(res, result, 200)
}

export async function refresh(req: Request, res: Response) {
  const plain = req.cookies?.[refreshCookieName()] as string | undefined
  if (!plain) {
    clearRefreshCookie(res)
    res.status(401).json({ error: 'Invalid refresh token' })
    return
  }
  try {
    const result = await authService.rotateRefreshSession(plain)
    sendAuthJson(res, result, 200)
  } catch {
    clearRefreshCookie(res)
    res.status(401).json({ error: 'Invalid refresh token' })
  }
}

export async function logout(req: Request, res: Response) {
  const plain = req.cookies?.[refreshCookieName()] as string | undefined
  if (plain) {
    await authService.revokeRefreshSession(plain)
  }
  clearRefreshCookie(res)
  res.status(204).send()
}
