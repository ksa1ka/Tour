import { api } from '@/shared/api/client'

export const SUPPORT_CATEGORIES = [
  { value: 'general', label: 'Общие вопросы' },
  { value: 'technical', label: 'Техническая проблема' },
  { value: 'tournaments', label: 'Турниры и матчи' },
  { value: 'fantasy', label: 'Фэнтези-лига' },
  { value: 'account', label: 'Аккаунт и доступ' },
  { value: 'other', label: 'Другое' },
] as const

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]['value']

export type SupportTicketStatus = 'OPEN' | 'CLOSED'

export type SupportMessageRole = 'USER' | 'ADMIN'

export type SupportMessagePayload = {
  email: string
  category: SupportCategory
  topic: string
  message: string
}

export type SupportMessageResponse = {
  ok: boolean
  ticketId: string
  message: string
}

export type SupportMessageDto = {
  id: string
  role: SupportMessageRole
  body: string
  createdAt: string
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

export type SupportTicketDetail = SupportTicketListItem & {
  messages: SupportMessageDto[]
}

export async function sendSupportMessage(payload: SupportMessagePayload): Promise<SupportMessageResponse> {
  const { data } = await api.post<SupportMessageResponse>('/support/messages', payload)
  return data
}

export async function fetchMySupportTickets(): Promise<SupportTicketListItem[]> {
  const { data } = await api.get<{ tickets: SupportTicketListItem[] }>('/support/tickets')
  return data.tickets
}

export async function fetchSupportTicket(publicId: string, email?: string): Promise<SupportTicketDetail> {
  const { data } = await api.get<{ ticket: SupportTicketDetail }>(`/support/tickets/${publicId}`, {
    params: email ? { email } : undefined,
  })
  return data.ticket
}

export async function sendSupportFollowUp(
  publicId: string,
  payload: { email: string; message: string },
): Promise<SupportTicketDetail> {
  const { data } = await api.post<{ ticket: SupportTicketDetail }>(
    `/support/tickets/${publicId}/messages`,
    payload,
  )
  return data.ticket
}

export function supportCategoryLabel(value: string): string {
  return SUPPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value
}
