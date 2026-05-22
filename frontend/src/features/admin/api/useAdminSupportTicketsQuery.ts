import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/services/api'
import type { SupportTicketDetail, SupportTicketListItem, SupportTicketStatus } from '@/features/support/api/supportService'

export function useAdminSupportTicketsQuery(enabled: boolean, status?: SupportTicketStatus) {
  return useQuery({
    queryKey: ['admin', 'support', 'tickets', status ?? 'all'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ tickets: SupportTicketListItem[] }>('/admin/support/tickets', {
        params: status ? { status } : undefined,
      })
      return data.tickets
    },
  })
}

export function useAdminSupportTicketQuery(enabled: boolean, ticketId: string | null) {
  return useQuery({
    queryKey: ['admin', 'support', 'ticket', ticketId],
    enabled: enabled && !!ticketId,
    refetchInterval: ticketId ? 10_000 : false,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const { data } = await api.get<{ ticket: SupportTicketDetail }>(`/admin/support/tickets/${ticketId}`)
      return data.ticket
    },
  })
}

export function useAdminSupportReplyMutation(ticketId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (message: string) => {
      const { data } = await api.post<{ ticket: SupportTicketDetail }>(
        `/admin/support/tickets/${ticketId}/replies`,
        { message },
      )
      return data.ticket
    },
    onSuccess: (ticket) => {
      queryClient.setQueryData(['admin', 'support', 'ticket', ticket.id], ticket)
      queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] })
    },
  })
}

export function useAdminSupportStatusMutation(ticketId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (status: SupportTicketStatus) => {
      const { data } = await api.patch<{ ticket: SupportTicketDetail }>(
        `/admin/support/tickets/${ticketId}`,
        { status },
      )
      return data.ticket
    },
    onSuccess: (ticket) => {
      queryClient.setQueryData(['admin', 'support', 'ticket', ticket.id], ticket)
      queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] })
    },
  })
}
