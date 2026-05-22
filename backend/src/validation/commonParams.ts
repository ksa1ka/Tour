import { z } from 'zod'

export const tournamentIdParamSchema = z.object({
  tournamentId: z.string().trim().min(1, 'Некорректный идентификатор турнира'),
})

export const tournamentTeamParamsSchema = z.object({
  tournamentId: z.string().trim().min(1, 'Некорректный идентификатор турнира'),
  teamId: z.string().trim().min(1, 'Некорректный идентификатор команды'),
})

export const tournamentMatchParamsSchema = z.object({
  tournamentId: z.string().trim().min(1, 'Некорректный идентификатор турнира'),
  matchId: z.string().trim().min(1, 'Некорректный идентификатор матча'),
})

/** Параметр `:id` в маршрутах `/tournaments/:id`. */
export const tournamentByIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Некорректный идентификатор турнира'),
})

export const fantasyTeamIdParamSchema = z.object({
  fantasyTeamId: z.string().trim().min(1, 'Некорректный идентификатор фантазийной команды'),
})
