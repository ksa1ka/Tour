import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/services/api'

import { type AdminUserListItem } from './useAdminUsersQuery'

export const adminUsersQueryKey = ['admin', 'users'] as const

type PatchResponse = { user: AdminUserListItem }

export function useUpdateAdminUserRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data } = await api.patch<PatchResponse>(`/admin/users/${userId}/role`, { role })
      return data.user
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUsersQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
