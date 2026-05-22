import { z } from 'zod'

export const FANTASY_MAX_TEAM_PICKS = 6
export const FANTASY_MIN_TEAM_PICKS = 1

const uniqueTeamIdsRefine = (ids: string[]) => new Set(ids).size === ids.length

const teamIdsField = z
  .array(z.string().trim().min(1, 'Пустой идентификатор команды'))
  .min(
    FANTASY_MIN_TEAM_PICKS,
    `Выберите от ${FANTASY_MIN_TEAM_PICKS} до ${FANTASY_MAX_TEAM_PICKS} команд`,
  )
  .max(
    FANTASY_MAX_TEAM_PICKS,
    `Выберите от ${FANTASY_MIN_TEAM_PICKS} до ${FANTASY_MAX_TEAM_PICKS} команд`,
  )
  .refine(uniqueTeamIdsRefine, { message: 'Команды не должны повторяться' })

/** Полное обновление имени и состава (например PATCH одним телом). */
export const upsertFantasyTeamBodySchema = z.object({
  name: z.union([z.string().trim().max(64, 'Имя не длиннее 64 символов'), z.null()]).optional(),
  teamIds: teamIdsField,
})

export const createFantasyTeamBodySchema = z.object({
  tournamentId: z.string().trim().min(1, 'Укажите турнир'),
  name: z
    .union([z.string().trim().max(64, 'Имя не длиннее 64 символов'), z.literal(''), z.null()])
    .optional()
    .transform((v) => (v === undefined || v === '' || v === null ? null : v)),
})

/** Состав привязан к турниру фантазийной команды; в теле только список teamIds. */
export const replaceFantasySelectionsBodySchema = z.object({
  teamIds: teamIdsField,
})

export type UpsertFantasyTeamBody = z.infer<typeof upsertFantasyTeamBodySchema>
export type CreateFantasyTeamBody = z.infer<typeof createFantasyTeamBodySchema>
export type ReplaceFantasySelectionsBody = z.infer<typeof replaceFantasySelectionsBodySchema>

const optionalCuid = z.union([z.string().trim().min(1), z.null()]).optional()

export const upsertFantasyMatchPredictionBodySchema = z.object({
  predictedWinnerTeamId: optionalCuid,
  predictedMvpPlayerId: optionalCuid,
  predictedFirstKillPlayerId: optionalCuid,
  predictedHighestScoreTeamId: optionalCuid,
  predictedScoreA: z.number().int().min(0).max(999).optional().nullable(),
  predictedScoreB: z.number().int().min(0).max(999).optional().nullable(),
})

export type UpsertFantasyMatchPredictionBody = z.infer<typeof upsertFantasyMatchPredictionBodySchema>
