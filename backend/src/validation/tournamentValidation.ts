import { z } from 'zod'

import { formatConfigBodySchema } from './formatConfigValidation.js'
import { optionalImageUrlForUpdate, optionalImageUrlToNull, refineImageUrl } from './imageUrlValidation.js'

/** Форматы с полной поддержкой генерации и таблицы. */
export const supportedTournamentFormat = z.enum(['SINGLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS'])

export const tournamentStatusZod = z.enum([
  'DRAFT',
  'OPEN',
  'REGISTRATION',
  'CLOSED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])

const tournamentGames = [
  'VALORANT',
  'CS2',
  'DOTA2',
  'LEAGUE_OF_LEGENDS',
  'DEADLOCK',
  'WORLD_OF_TANKS',
] as const

export const tournamentGameZod = z.enum(tournamentGames)

export const listTournamentsQuerySchema = z.object({
  game: tournamentGameZod.optional(),
})

export type ListTournamentsQuery = z.infer<typeof listTournamentsQuerySchema>

const avatarUrlInput = z.union([z.literal(''), z.null(), z.string()]).optional()

export const createTournamentBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Название обязательно').max(200),
    description: z.string().max(2000).optional(),
    avatarUrl: avatarUrlInput.transform((v) => optionalImageUrlToNull(v)),
    game: tournamentGameZod,
    format: supportedTournamentFormat.default('SINGLE_ELIMINATION'),
    formatConfig: formatConfigBodySchema.nullable(),
    status: tournamentStatusZod.optional(),
  })
  .superRefine((d, ctx) => {
    if (d.avatarUrl != null) refineImageUrl(d.avatarUrl, ctx, ['avatarUrl'])
  })

export const fantasyPredictionTypeZod = z.enum(['WINNER', 'MVP', 'FIRST_KILL', 'HIGHEST_SCORE', 'EXACT_SCORE'])

export const updateTournamentBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    avatarUrl: avatarUrlInput.transform((v) => optionalImageUrlForUpdate(v)),
    game: tournamentGameZod.optional(),
    format: supportedTournamentFormat.optional(),
    formatConfig: formatConfigBodySchema.nullable(),
    status: tournamentStatusZod.optional(),
    fantasyActivePredictions: z.array(fantasyPredictionTypeZod).min(1, 'Выберите хотя бы один тип прогноза').optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Укажите хотя бы одно поле для обновления',
  })
  .superRefine((d, ctx) => {
    if (d.avatarUrl !== undefined && d.avatarUrl !== null) refineImageUrl(d.avatarUrl, ctx, ['avatarUrl'])
  })

export type CreateTournamentBody = z.infer<typeof createTournamentBodySchema>
export type UpdateTournamentBody = z.infer<typeof updateTournamentBodySchema>
