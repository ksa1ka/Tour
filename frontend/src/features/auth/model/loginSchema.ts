import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Некорректный email').transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'Введите пароль').max(128, 'Пароль слишком длинный'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
