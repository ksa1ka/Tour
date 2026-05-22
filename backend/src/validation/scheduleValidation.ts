import { z } from 'zod'

import { ROUND_ROBIN_MAX_TEAMS, ROUND_ROBIN_MIN_TEAMS } from '../utils/roundRobinSchedule.js'

export const generateRoundRobinBodySchema = z
  .object({
    teamIds: z.array(z.string().trim().min(1)).min(ROUND_ROBIN_MIN_TEAMS).max(ROUND_ROBIN_MAX_TEAMS),
  })
  .superRefine((data, ctx) => {
    if (new Set(data.teamIds).size !== data.teamIds.length) {
      ctx.addIssue({ code: 'custom', message: 'Дубликаты в списке команд', path: ['teamIds'] })
    }
  })

export const generateSwissRound1BodySchema = z.object({
  teamIds: z.array(z.string().trim().min(1)).min(4).optional(),
})

export type GenerateRoundRobinBody = z.infer<typeof generateRoundRobinBodySchema>
export type GenerateSwissRound1Body = z.infer<typeof generateSwissRound1BodySchema>
