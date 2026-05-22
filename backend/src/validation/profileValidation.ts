import { z } from 'zod'

import { isValidStoredImageUrl } from './imageUrlValidation.js'

export const updateProfileBodySchema = z
  .object({
    displayName: z
      .union([z.string().max(80), z.null()])
      .optional()
      .transform((v) => (v === undefined ? undefined : typeof v === 'string' ? v.trim() || null : v)),
    bio: z.union([z.string().max(500), z.null()]).optional(),
    avatarUrl: z
      .union([z.literal(''), z.string().max(600_000), z.null()])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === '' ? null : v)),
  })
  .refine((d) => d.displayName !== undefined || d.bio !== undefined || d.avatarUrl !== undefined, {
    message: 'Укажите хотя бы одно поле для обновления',
  })
  .superRefine((d, ctx) => {
    if (d.avatarUrl === undefined || d.avatarUrl === null) return
    if (!isValidStoredImageUrl(d.avatarUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Аватар: укажите http(s)-ссылку или data:image в base64',
        path: ['avatarUrl'],
      })
    }
  })

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>
