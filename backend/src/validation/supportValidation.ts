import { SupportTicketStatus } from '@prisma/client'
import { z } from 'zod'

export const supportCategorySchema = z.enum([
  'general',
  'technical',
  'tournaments',
  'fantasy',
  'account',
  'other',
])

const emailField = z
  .string()
  .trim()
  .email('Укажите корректный email')
  .transform((v) => v.toLowerCase())

export const supportMessageBodySchema = z.object({
  email: emailField,
  category: supportCategorySchema,
  topic: z
    .string()
    .trim()
    .min(3, 'Тема не короче 3 символов')
    .max(200, 'Тема не длиннее 200 символов'),
  message: z
    .string()
    .trim()
    .min(10, 'Сообщение не короче 10 символов')
    .max(8000, 'Сообщение слишком длинное'),
})

export type SupportMessageBody = z.infer<typeof supportMessageBodySchema>

export const supportPublicIdParamsSchema = z.object({
  publicId: z.string().trim().min(3).max(64),
})

export const supportTicketEmailQuerySchema = z.object({
  email: emailField.optional(),
})

export const supportFollowUpBodySchema = z.object({
  email: emailField,
  message: z
    .string()
    .trim()
    .min(1, 'Сообщение не может быть пустым')
    .max(8000, 'Сообщение слишком длинное'),
})

export const adminSupportTicketIdParamsSchema = z.object({
  ticketId: z.string().cuid(),
})

export const adminSupportReplyBodySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Ответ не может быть пустым')
    .max(8000, 'Ответ слишком длинный'),
})

export const adminSupportStatusBodySchema = z.object({
  status: z.nativeEnum(SupportTicketStatus),
})

export const adminSupportListQuerySchema = z.object({
  status: z.nativeEnum(SupportTicketStatus).optional(),
})

export type SupportFollowUpBody = z.infer<typeof supportFollowUpBodySchema>
export type SupportTicketEmailQuery = z.infer<typeof supportTicketEmailQuerySchema>
export type AdminSupportListQuery = z.infer<typeof adminSupportListQuerySchema>
export type AdminSupportReplyBody = z.infer<typeof adminSupportReplyBodySchema>
export type AdminSupportStatusBody = z.infer<typeof adminSupportStatusBodySchema>
