import { SupportMessageRole, SupportTicketStatus } from '@prisma/client'

import { NotFoundError, ForbiddenError } from '../errors/HttpError.js'
import { prisma } from '../prisma/client.js'
import type { SupportMessageBody } from '../validation/supportValidation.js'

function newPublicTicketId(): string {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `${t}-${r}`
}

export type SupportTicketListItem = {
  id: string
  publicId: string
  email: string
  category: string
  topic: string
  status: SupportTicketStatus
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessageAt: string | null
}

export type SupportMessageDto = {
  id: string
  role: SupportMessageRole
  body: string
  createdAt: string
}

export type SupportTicketDetail = SupportTicketListItem & {
  messages: SupportMessageDto[]
}

function toListItem(
  ticket: {
    id: string
    publicId: string
    email: string
    category: string
    topic: string
    status: SupportTicketStatus
    createdAt: Date
    updatedAt: Date
    _count: { messages: number }
    messages: { createdAt: Date }[]
  },
): SupportTicketListItem {
  const last = ticket.messages[0]
  return {
    id: ticket.id,
    publicId: ticket.publicId,
    email: ticket.email,
    category: ticket.category,
    topic: ticket.topic,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    messageCount: ticket._count.messages,
    lastMessageAt: last ? last.createdAt.toISOString() : null,
  }
}

function toDetail(
  ticket: {
    id: string
    publicId: string
    email: string
    category: string
    topic: string
    status: SupportTicketStatus
    createdAt: Date
    updatedAt: Date
    userId: string | null
    messages: { id: string; role: SupportMessageRole; body: string; createdAt: Date }[]
  },
  messageCount: number,
  lastMessageAt: string | null,
): SupportTicketDetail {
  return {
    id: ticket.id,
    publicId: ticket.publicId,
    email: ticket.email,
    category: ticket.category,
    topic: ticket.topic,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    messageCount,
    lastMessageAt,
    messages: ticket.messages.map((m) => ({
      id: m.id,
      role: m.role,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  }
}

const listSelect = {
  id: true,
  publicId: true,
  email: true,
  category: true,
  topic: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { messages: true } },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { createdAt: true },
  },
} as const

export async function createSupportTicket(
  body: SupportMessageBody,
  userId: string | undefined,
): Promise<{ publicId: string; ticketId: string }> {
  const publicId = newPublicTicketId()

  const ticket = await prisma.supportTicket.create({
    data: {
      publicId,
      email: body.email,
      userId: userId ?? null,
      category: body.category,
      topic: body.topic,
      messages: {
        create: {
          role: SupportMessageRole.USER,
          body: body.message,
        },
      },
    },
    select: { id: true, publicId: true },
  })

  return { publicId: ticket.publicId, ticketId: ticket.id }
}

export async function listTicketsForUser(userId: string, userEmail: string): Promise<SupportTicketListItem[]> {
  const tickets = await prisma.supportTicket.findMany({
    where: {
      OR: [{ userId }, { email: userEmail }],
    },
    orderBy: { updatedAt: 'desc' },
    select: listSelect,
  })
  return tickets.map(toListItem)
}

async function findTicketByPublicId(publicId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { publicId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      _count: { select: { messages: true } },
    },
  })
  if (!ticket) throw new NotFoundError('Обращение не найдено')
  return ticket
}

function assertTicketAccess(
  ticket: { email: string; userId: string | null },
  opts: { userId?: string; userEmail?: string; email?: string },
) {
  if (opts.userId) {
    if (ticket.userId === opts.userId) return
    if (opts.userEmail && ticket.email === opts.userEmail.toLowerCase()) return
    throw new ForbiddenError('Нет доступа к этому обращению')
  }
  const email = opts.email ?? opts.userEmail
  if (email && ticket.email === email.toLowerCase()) return
  throw new ForbiddenError('Нет доступа к этому обращению')
}

export async function getTicketForUser(
  publicId: string,
  opts: { userId?: string; userEmail?: string; email?: string },
): Promise<SupportTicketDetail> {
  const ticket = await findTicketByPublicId(publicId)
  assertTicketAccess(ticket, opts)

  const last = ticket.messages[ticket.messages.length - 1]
  return toDetail(
    ticket,
    ticket._count.messages,
    last ? last.createdAt.toISOString() : null,
  )
}

export async function addUserMessage(
  publicId: string,
  message: string,
  opts: { userId?: string; userEmail?: string; email: string },
): Promise<SupportTicketDetail> {
  const ticket = await findTicketByPublicId(publicId)
  assertTicketAccess(ticket, { ...opts, email: opts.email })

  if (ticket.status === SupportTicketStatus.CLOSED) {
    throw new ForbiddenError('Обращение закрыто. Откройте новое обращение.')
  }

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        role: SupportMessageRole.USER,
        body: message,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        updatedAt: new Date(),
        ...(opts.userId && !ticket.userId ? { userId: opts.userId } : {}),
      },
    }),
  ])

  return getTicketForUser(publicId, opts)
}

export async function listTicketsForAdmin(status?: SupportTicketStatus): Promise<SupportTicketListItem[]> {
  const tickets = await prisma.supportTicket.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: 'desc' },
    select: listSelect,
  })
  return tickets.map(toListItem)
}

export async function getTicketForAdmin(ticketId: string): Promise<SupportTicketDetail> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      _count: { select: { messages: true } },
    },
  })
  if (!ticket) throw new NotFoundError('Обращение не найдено')

  const last = ticket.messages[ticket.messages.length - 1]
  return toDetail(
    ticket,
    ticket._count.messages,
    last ? last.createdAt.toISOString() : null,
  )
}

export async function addAdminReply(ticketId: string, message: string): Promise<SupportTicketDetail> {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new NotFoundError('Обращение не найдено')

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        ticketId,
        role: SupportMessageRole.ADMIN,
        body: message,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date(), status: SupportTicketStatus.OPEN },
    }),
  ])

  return getTicketForAdmin(ticketId)
}

export async function updateTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
): Promise<SupportTicketDetail> {
  const exists = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { id: true } })
  if (!exists) throw new NotFoundError('Обращение не найдено')

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  })

  return getTicketForAdmin(ticketId)
}
