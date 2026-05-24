import { UserRole } from '@prisma/client'
import { z } from 'zod'

export const adminUserIdParamsSchema = z.object({
  userId: z.string().min(1),
})

export type AdminUserIdParams = z.infer<typeof adminUserIdParamsSchema>

export const adminUpdateUserRoleBodySchema = z.object({
  role: z.enum([UserRole.ADMIN, UserRole.VIEWER, UserRole.PLAYER]),
})

export type AdminUpdateUserRoleBody = z.infer<typeof adminUpdateUserRoleBodySchema>
