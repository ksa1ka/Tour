import type { NextFunction, Request, Response } from 'express'

import * as profileService from '../services/profileService.js'

export async function getUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const rawId = req.params.userId
    const userId = typeof rawId === 'string' ? rawId.trim() : ''
    if (!userId) {
      res.status(400).json({ error: 'User id required' })
      return
    }

    const profile = await profileService.getUserPublicProfileBundle(userId)
    if (!profile) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ profile })
  } catch (err) {
    next(err)
  }
}
