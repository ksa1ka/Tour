import { z } from 'zod'

import { optionalImageUrlForUpdate, optionalImageUrlToNull, refineImageUrl } from './imageUrlValidation.js'

export const listTeamsQuerySchema = z.object({
  tournamentId: z.string().trim().min(1).optional(),
})

export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>

const logoInput = z.union([z.literal(''), z.null(), z.string()]).optional()

export const createTeamBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Введите название').max(120),
    logo: logoInput.transform((v) => optionalImageUrlToNull(v)),
  })
  .superRefine((d, ctx) => {
    if (d.logo != null) refineImageUrl(d.logo, ctx, ['logo'])
  })

export const updateTeamBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Введите название').max(120).optional(),
    logo: logoInput.transform((v) => optionalImageUrlForUpdate(v)),
  })
  .refine((d) => d.name !== undefined || d.logo !== undefined, {
    message: 'Укажите хотя бы одно поле для обновления',
  })
  .superRefine((d, ctx) => {
    if (d.logo !== undefined && d.logo !== null) refineImageUrl(d.logo, ctx, ['logo'])
  })

export type CreateTeamBody = z.infer<typeof createTeamBodySchema>
export type UpdateTeamBody = z.infer<typeof updateTeamBodySchema>
