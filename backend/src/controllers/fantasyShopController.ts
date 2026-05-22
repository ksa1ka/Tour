import type { NextFunction, Request, Response } from 'express'

import * as fantasyShopService from '../services/fantasyShopService.js'
import type { FantasyShopPurchaseBody } from '../validation/fantasyShopValidation.js'

export async function listRewards(_req: Request, res: Response, next: NextFunction) {
  try {
    const rewards = await fantasyShopService.listShopRewards()
    res.json({ rewards })
  } catch (err) {
    next(err)
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    const data = await fantasyShopService.getShopMe(userId)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function purchase(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId as string
    const body = req.body as FantasyShopPurchaseBody
    const data = await fantasyShopService.purchaseReward(userId, body.rewardId)
    res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}
