import { z } from 'zod'

const scoreField = z.number().int('Счёт — целое число').min(0, 'Счёт не может быть отрицательным').max(999, 'Счёт слишком большой')

export const updateMatchScoreBodySchema = z.object({
  scoreA: scoreField,
  scoreB: scoreField,
})

export const updateMatchResultBodySchema = z.union([
  z.object({
    mode: z.literal('set'),
    scoreA: scoreField,
    scoreB: scoreField,
    mvpPlayerId: z.string().trim().min(1).optional().nullable(),
    firstKillPlayerId: z.string().trim().min(1).optional().nullable(),
  }),
  z.object({ mode: z.literal('clear') }),
])

export type UpdateMatchResultBody = z.infer<typeof updateMatchResultBodySchema>
