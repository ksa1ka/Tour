import type { NextFunction, Request, Response } from 'express'

import * as profileService from '../services/profileService.js'
import { updateProfileBodySchema } from '../validation/profileValidation.js'

export async function getMine(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await profileService.getUserProfileBundle(req.userId as string)
    if (!profile) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ profile })
  } catch (err) {
    next(err)
  }
}

export async function patchMine(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateProfileBodySchema.parse(req.body)
    await profileService.updateUserProfile(req.userId as string, body)
    const profile = await profileService.getUserProfileBundle(req.userId as string)
    if (!profile) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ profile })
  } catch (err) {
    next(err)
  }
}
