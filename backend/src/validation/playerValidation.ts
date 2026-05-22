import { z } from 'zod'

import { optionalImageUrlForUpdate, optionalImageUrlToNull, refineImageUrl } from './imageUrlValidation.js'

const avatarInput = z.union([z.literal(''), z.null(), z.string()]).optional()

export const createPlayerBodySchema = z
  .object({
    nickname: z.string().trim().min(1, 'Введите никнейм').max(60),
    /** JSON часто шлёт null; optional() в Zod не принимает null без union */
    realName: z
      .union([z.literal(''), z.null(), z.string().trim().max(120)])
      .optional()
      .transform((v) => (v === undefined || v === null || v === '' ? null : v)),
    role: z.string().trim().min(1, 'Укажите роль').max(60),
    country: z
      .union([z.literal(''), z.null(), z.string().trim().max(60)])
      .optional()
      .transform((v) => (v === undefined || v === null || v === '' ? null : v)),
    avatar: avatarInput.transform((v) => optionalImageUrlToNull(v)),
    isStarter: z
      .union([z.boolean(), z.null()])
      .optional()
      .transform((v) => (v === null || v === undefined ? true : v)),
  })
  .superRefine((d, ctx) => {
    if (d.avatar != null) refineImageUrl(d.avatar, ctx, ['avatar'])
  })

export const updatePlayerBodySchema = z
  .object({
    nickname: z.string().trim().min(1, 'Введите никнейм').max(60).optional(),
    realName: z
      .union([z.literal(''), z.null(), z.string().trim().max(120)])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === '' ? null : v)),
    role: z.string().trim().min(1, 'Укажите роль').max(60).optional(),
    country: z
      .union([z.literal(''), z.null(), z.string().trim().max(60)])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === '' ? null : v)),
    avatar: avatarInput.transform((v) => optionalImageUrlForUpdate(v)),
    isStarter: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.nickname !== undefined ||
      d.realName !== undefined ||
      d.role !== undefined ||
      d.country !== undefined ||
      d.avatar !== undefined ||
      d.isStarter !== undefined,
    { message: 'Укажите хотя бы одно поле для обновления' },
  )
  .superRefine((d, ctx) => {
    if (d.avatar !== undefined && d.avatar !== null) refineImageUrl(d.avatar, ctx, ['avatar'])
  })

export type CreatePlayerBody = z.infer<typeof createPlayerBodySchema>
export type UpdatePlayerBody = z.infer<typeof updatePlayerBodySchema>

export const tournamentTeamPlayerParamsSchema = z.object({
  tournamentId: z.string().trim().min(1, 'Некорректный идентификатор турнира'),
  teamId: z.string().trim().min(1, 'Некорректный идентификатор команды'),
  playerId: z.string().trim().min(1, 'Некорректный идентификатор игрока'),
})
