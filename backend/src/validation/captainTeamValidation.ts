import { z } from 'zod'

import { createPlayerBodySchema } from './playerValidation.js'
import { createTeamBodySchema } from './teamValidation.js'

export const registerCaptainTeamBodySchema = createTeamBodySchema.extend({
  players: z
    .array(createPlayerBodySchema)
    .min(1, 'Добавьте минимум одного игрока в состав')
    .max(10, 'Не более 10 игроков в заявке'),
})

export const updateCaptainTeamBodySchema = registerCaptainTeamBodySchema

export type RegisterCaptainTeamBody = z.infer<typeof registerCaptainTeamBodySchema>
export type UpdateCaptainTeamBody = z.infer<typeof updateCaptainTeamBodySchema>
