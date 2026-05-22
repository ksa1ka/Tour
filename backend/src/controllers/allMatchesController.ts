import type { NextFunction, Request, Response } from 'express'

import * as allMatchesFeedService from '../services/allMatchesFeedService.js'

export async function listFeed(_req: Request, res: Response, next: NextFunction) {
  try {
    const matches = await allMatchesFeedService.listAllMatchesWithTournament()
    res.json({ matches })
  } catch (err) {
    next(err)
  }
}
