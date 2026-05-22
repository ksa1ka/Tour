import type { Request, Response } from 'express'

import * as adminService from '../services/adminService.js'

export async function getDashboardStats(_req: Request, res: Response) {
  const stats = await adminService.getDashboardStats()
  res.json({ stats })
}

export async function listUsers(_req: Request, res: Response) {
  const users = await adminService.listUsersForAdmin()
  res.json({ users })
}

export async function listFantasyTeams(_req: Request, res: Response) {
  const fantasyTeams = await adminService.listFantasyTeamsForAdmin()
  res.json({ fantasyTeams })
}

export async function listRewardPurchases(_req: Request, res: Response) {
  const purchases = await adminService.listRewardPurchasesForAdmin()
  res.json({ purchases })
}

export async function listShopRewards(_req: Request, res: Response) {
  const rewards = await adminService.listShopRewardsForAdmin()
  res.json({ rewards })
}

export async function updateShopRewardImage(req: Request, res: Response) {
  const rewardId = req.params.rewardId as string
  const body = req.body as { image: string }
  const reward = await adminService.updateShopRewardImage(rewardId, body.image)
  res.json({ reward })
}
