import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api'

export type AdminUserListItem = {
  id: string
  email: string
  role: string
  displayName: string | null
  fantasyPointsBalance: number
  createdAt: string
}

type AdminUsersResponse = {
  users: AdminUserListItem[]
}

export function useAdminUsersQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'users'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<AdminUsersResponse>('/admin/users')
      return data.users
    },
  })
}
