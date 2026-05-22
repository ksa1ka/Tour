import { z } from 'zod'

import { isAllowedImageSrc } from '@/shared/lib/imageUrl'

const avatarOk = (s: string) => s.length === 0 || isAllowedImageSrc(s)

export const profileFormSchema = z.object({
  displayName: z.string().max(80),
  bio: z.string().max(500),
  avatarUrl: z
    .string()
    .max(600_000)
    .refine(avatarOk, { message: 'Укажите ссылку на фото (https://…)' }),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>
