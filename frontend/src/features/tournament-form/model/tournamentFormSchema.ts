import { z } from 'zod'

import { CREATABLE_TOURNAMENT_FORMATS, TOURNAMENT_GAMES } from '@/entities/tournament/model/types'
import { isAllowedImageSrc } from '@/shared/lib/imageUrl'

const imageUrlOk = (s: string) => s.trim().length === 0 || isAllowedImageSrc(s)

export const tournamentFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Введите название').max(200),
    description: z.string().max(2000).optional(),
    avatarUrl: z
      .string()
      .max(600_000)
      .refine(imageUrlOk, { message: 'Укажите ссылку на изображение (https://…)' }),
    game: z.enum(TOURNAMENT_GAMES),
    format: z.enum(CREATABLE_TOURNAMENT_FORMATS),
    swissRounds: z.string().optional(),
    status: z.enum([
      'DRAFT',
      'OPEN',
      'REGISTRATION',
      'CLOSED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ]),
  })
  .superRefine((data, ctx) => {
    if (data.format !== 'SWISS') return
    const raw = data.swissRounds?.trim()
    if (!raw) return
    const n = Number(raw)
    if (!Number.isInteger(n) || n < 3 || n > 12) {
      ctx.addIssue({
        code: 'custom',
        message: 'Укажите целое число туров от 3 до 12 или оставьте поле пустым',
        path: ['swissRounds'],
      })
    }
  })

export type TournamentFormValues = z.infer<typeof tournamentFormSchema>
