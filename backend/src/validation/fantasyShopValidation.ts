import { z } from 'zod'

export const fantasyShopPurchaseBodySchema = z.object({
  rewardId: z.string().min(1),
})

export type FantasyShopPurchaseBody = z.infer<typeof fantasyShopPurchaseBodySchema>
