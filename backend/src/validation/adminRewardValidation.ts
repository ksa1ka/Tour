import { z } from 'zod'

import { refineImageUrl } from './imageUrlValidation.js'

export const adminShopRewardIdParamsSchema = z.object({
  rewardId: z.string().min(1),
})

export type AdminShopRewardIdParams = z.infer<typeof adminShopRewardIdParamsSchema>

export const adminUpdateShopRewardImageBodySchema = z
  .object({
    image: z.string().min(1, 'Укажите ссылку или загрузите файл'),
  })
  .superRefine((d, ctx) => refineImageUrl(d.image, ctx, ['image']))

export type AdminUpdateShopRewardImageBody = z.infer<typeof adminUpdateShopRewardImageBodySchema>
