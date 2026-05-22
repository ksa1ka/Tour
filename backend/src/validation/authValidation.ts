import { UserRole } from '@prisma/client'
import { z } from 'zod'

const emailField = z
  .string()
  .trim()
  .email('Укажите корректный email')
  .transform((v) => v.toLowerCase())

export const registerBodySchema = z.object({
  email: emailField,
  password: z.string().min(6, 'Пароль не короче 6 символов').max(128, 'Пароль слишком длинный'),
  /** Категория аккаунта при регистрации: зритель или игрок (не админ). */
  accountRole: z.enum([UserRole.VIEWER, UserRole.PLAYER]).default(UserRole.VIEWER),
})

export const loginBodySchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Введите пароль').max(128, 'Пароль слишком длинный'),
})

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
