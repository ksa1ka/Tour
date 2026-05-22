import { z } from 'zod'

import { FANTASY_MAX_TEAM_PICKS, FANTASY_MIN_TEAM_PICKS } from '@/shared/lib/fantasyLimits'

export const tournamentFantasyFormSchema = z.object({
  teamIds: z
    .array(z.string())
    .min(FANTASY_MIN_TEAM_PICKS, `Выберите от ${FANTASY_MIN_TEAM_PICKS} до ${FANTASY_MAX_TEAM_PICKS} команд`)
    .max(FANTASY_MAX_TEAM_PICKS, `Выберите от ${FANTASY_MIN_TEAM_PICKS} до ${FANTASY_MAX_TEAM_PICKS} команд`)
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Команды не должны повторяться' }),
})

export type TournamentFantasyFormValues = z.infer<typeof tournamentFantasyFormSchema>
