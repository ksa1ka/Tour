import type { Request, Response } from 'express'

import * as supportService from '../services/supportService.js'
import type {
  SupportFollowUpBody,
  SupportMessageBody,
  SupportTicketEmailQuery,
} from '../validation/supportValidation.js'

/** Создать обращение в поддержку. */
export async function postSupportMessage(req: Request, res: Response) {
  const body = req.body as SupportMessageBody
  const { publicId } = await supportService.createSupportTicket(body, req.userId)

  res.status(201).json({
    ok: true,
    ticketId: publicId,
    message: 'Сообщение принято. Ответ появится в переписке по этому обращению.',
  })
}

/** Список обращений текущего пользователя. */
export async function listMySupportTickets(req: Request, res: Response) {
  const userId = req.userId
  const userEmail = req.userEmail
  if (!userId || !userEmail) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const tickets = await supportService.listTicketsForUser(userId, userEmail)
  res.json({ tickets })
}

/** Переписка по обращению (для владельца или по email). */
export async function getSupportTicket(req: Request, res: Response) {
  const publicId = req.params.publicId as string
  const query = (req.validatedQuery ?? {}) as SupportTicketEmailQuery

  if (!req.userId && !query.email) {
    res.status(400).json({ error: 'Укажите email для просмотра обращения' })
    return
  }

  const ticket = await supportService.getTicketForUser(publicId, {
    userId: req.userId,
    userEmail: req.userEmail,
    email: query.email,
  })

  res.json({ ticket })
}

/** Дополнительное сообщение пользователя в существующее обращение. */
export async function postSupportFollowUp(req: Request, res: Response) {
  const publicId = req.params.publicId as string
  const body = req.body as SupportFollowUpBody

  const ticket = await supportService.addUserMessage(publicId, body.message, {
    userId: req.userId,
    userEmail: req.userEmail,
    email: body.email,
  })

  res.json({ ticket })
}
