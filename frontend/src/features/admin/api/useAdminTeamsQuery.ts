import { useQuery } from '@tanstack/react-query'

import { fetchTeams } from '@/entities/team/api/teamApi'

export function useAdminTeamsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'teams'],
    enabled,
    queryFn: () => fetchTeams(),
  })
}
