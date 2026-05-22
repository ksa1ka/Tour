import { z } from 'zod'

export const formatConfigBodySchema = z
  .object({
    pointsWin: z.number().int().min(0).max(10).optional(),
    pointsDraw: z.number().int().min(0).max(10).optional(),
    pointsLoss: z.number().int().min(0).max(10).optional(),
    swissRounds: z.number().int().min(3).max(12).optional(),
  })
  .optional()

export type FormatConfigBody = z.infer<typeof formatConfigBodySchema>
