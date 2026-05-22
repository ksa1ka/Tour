import { z } from 'zod'

import { isAllowedImageSrc } from '@/shared/lib/imageUrl'

const imageFieldMessage = 'Укажите ссылку на изображение (https://…)'

const logoField = z
  .union([z.literal(''), z.string().max(600_000)])
  .refine((s) => s === '' || isAllowedImageSrc(s), { message: imageFieldMessage })

export const teamFormSchema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(120),
  logo: logoField,
})

export type TeamFormValues = z.infer<typeof teamFormSchema>

export function teamPayloadFromForm(values: TeamFormValues): { name: string; logo: string | null } {
  const logo = values.logo?.trim()
  return {
    name: values.name.trim(),
    logo: logo && logo.length > 0 ? logo : null,
  }
}
