import { z } from 'zod'

import type { Player } from '@/entities/team/model/types'
import { isAllowedImageSrc } from '@/shared/lib/imageUrl'

const imageFieldMessage = 'Укажите ссылку на изображение (начинается с https://)'

const optionalImageField = z
  .union([z.literal(''), z.string().max(600_000)])
  .refine((s) => s === '' || isAllowedImageSrc(s), { message: imageFieldMessage })

export const playerFormSchema = z.object({
  nickname: z.string().trim().min(1, 'Введите никнейм').max(60),
  role: z.string().trim().min(1, 'Укажите роль').max(60),
  realName: z.string().trim().max(120).optional(),
  country: z.string().trim().max(60).optional(),
  avatar: optionalImageField,
  /** HTML select value */
  rosterSlot: z.enum(['starter', 'sub']),
})

export type PlayerFormValues = z.infer<typeof playerFormSchema>

export function playerFormValuesFromPlayer(player: Player): PlayerFormValues {
  return {
    nickname: player.nickname,
    role: player.role,
    realName: player.realName ?? '',
    country: player.country ?? '',
    avatar: player.avatar ?? '',
    rosterSlot: player.isStarter ? 'starter' : 'sub',
  }
}

export function playerPayloadFromForm(values: PlayerFormValues) {
  const realName = values.realName?.trim()
  const country = values.country?.trim()
  const avatar = (values.avatar ?? '').trim()
  return {
    nickname: values.nickname.trim(),
    role: values.role.trim(),
    realName: realName && realName.length > 0 ? realName : null,
    country: country && country.length > 0 ? country : null,
    avatar: avatar && avatar.length > 0 ? avatar : null,
    isStarter: values.rosterSlot === 'starter',
  }
}
