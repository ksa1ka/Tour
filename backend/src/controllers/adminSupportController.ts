import type { Request, Response } from 'express'
import { SupportTicketStatus } from '@prisma/client'

import * as supportService from '../services/supportService.js'
import type {
  AdminSupportListQuery,
  AdminSupportReplyBody,
  AdminSupportStatusBody,
} from '../validation/supportValidation.js'

export async function listSupportTickets(req: Request, res: Response) {
  const query = req.query as unknown as AdminSupportListQuery
  const tickets = await supportService.listTicketsForAdmin(query.status)
  res.json({ tickets })
}

export async function getSupportTicket(req: Request, res: Response) {
  const ticketId = req.params.ticketId as string
  const ticket = await supportService.getTicketForAdmin(ticketId)
  res.json({ ticket })
}

export async function postSupportReply(req: Request, res: Response) {
  const ticketId = req.params.ticketId as string
  const body = req.body as AdminSupportReplyBody
  const ticket = await supportService.addAdminReply(ticketId, body.message)
  res.json({ ticket })
}

export async function patchSupportTicketStatus(req: Request, res: Response) {
  const ticketId = req.params.ticketId as string
  const body = req.body as AdminSupportStatusBody
  const ticket = await supportService.updateTicketStatus(ticketId, body.status as SupportTicketStatus)
  res.json({ ticket })
}
