import { z } from 'zod'

import type { Player, Team } from '@/entities/team/model/types'
import { isAllowedImageSrc } from '@/shared/lib/imageUrl'

const imageFieldMessage = 'Укажите ссылку на изображение (начинается с https://)'

const optionalImageField = z
  .union([z.literal(''), z.string().max(600_000)])
  .refine((s) => s === '' || isAllowedImageSrc(s), { message: imageFieldMessage })

const rosterPlayerSchema = z.object({
  nickname: z.string().trim().min(1, 'Введите никнейм').max(60),
  role: z.string().trim().min(1, 'Укажите роль').max(60),
  realName: z.string().trim().max(120).optional(),
  country: z.string().trim().max(60).optional(),
  rosterSlot: z.enum(['starter', 'sub']),
})

export const captainTeamFormSchema = z.object({
  name: z.string().trim().min(1, 'Введите название команды').max(120),
  logo: optionalImageField,
  players: z.array(rosterPlayerSchema).min(1, 'Добавьте минимум одного игрока').max(10),
})

export type CaptainTeamFormValues = z.infer<typeof captainTeamFormSchema>

export const emptyCaptainTeamFormValues: CaptainTeamFormValues = {
  name: '',
  logo: '',
  players: [{ nickname: '', role: '', realName: '', country: '', rosterSlot: 'starter' }],
}

export function captainTeamFormValuesFromTeam(team: Team): CaptainTeamFormValues {
  return {
    name: team.name,
    logo: team.logo ?? '',
    players:
      team.players.length > 0
        ? team.players.map((p) => ({
            nickname: p.nickname,
            role: p.role,
            realName: p.realName ?? '',
            country: p.country ?? '',
            rosterSlot: p.isStarter ? ('starter' as const) : ('sub' as const),
          }))
        : emptyCaptainTeamFormValues.players,
  }
}

export function captainTeamPayloadFromForm(values: CaptainTeamFormValues) {
  const logo = (values.logo ?? '').trim()
  return {
    name: values.name.trim(),
    logo: logo.length > 0 ? logo : null,
    players: values.players.map((p) => {
      const realName = p.realName?.trim()
      const country = p.country?.trim()
      return {
        nickname: p.nickname.trim(),
        role: p.role.trim(),
        realName: realName && realName.length > 0 ? realName : null,
        country: country && country.length > 0 ? country : null,
        avatar: null,
        isStarter: p.rosterSlot === 'starter',
      }
    }),
  }
}

export type CaptainTeamRosterPlayer = ReturnType<typeof captainTeamPayloadFromForm>['players'][number]

export function rosterPlayerLabel(p: Player): string {
  return `${p.nickname} · ${p.role}`
}
