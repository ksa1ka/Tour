import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().trim().email('Некорректный email').transform((v) => v.toLowerCase()),
  password: z.string().min(6, 'Пароль не короче 6 символов').max(128, 'Пароль слишком длинный'),
  accountRole: z.enum(['VIEWER', 'PLAYER']),
})

export type RegisterFormValues = z.infer<typeof registerSchema>
