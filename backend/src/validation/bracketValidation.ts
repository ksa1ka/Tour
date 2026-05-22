import { z } from 'zod'

import { SINGLE_ELIMINATION_TEAM_COUNTS } from '../utils/bracketUtils.js'

export const generateBracketBodySchema = z
  .object({
    teamIds: z.array(z.string().min(1, 'Пустой идентификатор команды')).min(4).max(32),
  })
  .superRefine((data, ctx) => {
    if (!(SINGLE_ELIMINATION_TEAM_COUNTS as readonly number[]).includes(data.teamIds.length)) {
      ctx.addIssue({
        code: 'custom',
        message: `Число команд должно быть одним из: ${SINGLE_ELIMINATION_TEAM_COUNTS.join(', ')}`,
        path: ['teamIds'],
      })
    }
  })

export type GenerateBracketBody = z.infer<typeof generateBracketBodySchema>

export const setMatchWinnerBodySchema = z.object({
  winnerId: z.string().trim().min(1, 'Укажите победителя'),
  scoreA: z.number().int('Счёт A — целое число').nonnegative('Счёт не может быть отрицательным').optional().nullable(),
  scoreB: z.number().int('Счёт B — целое число').nonnegative('Счёт не может быть отрицательным').optional().nullable(),
  mvpPlayerId: z.string().trim().min(1).optional().nullable(),
  firstKillPlayerId: z.string().trim().min(1).optional().nullable(),
})

export type SetMatchWinnerBody = z.infer<typeof setMatchWinnerBodySchema>

export const swapBracketTeamSlotsBodySchema = z.object({
  fromMatchId: z.string().trim().min(1, 'Укажите матч-источник'),
  fromSide: z.enum(['A', 'B']),
  toMatchId: z.string().trim().min(1, 'Укажите матч-назначение'),
  toSide: z.enum(['A', 'B']),
})

export type SwapBracketTeamSlotsBody = z.infer<typeof swapBracketTeamSlotsBodySchema>
