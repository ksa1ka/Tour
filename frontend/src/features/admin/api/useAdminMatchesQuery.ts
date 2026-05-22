import { useQuery } from '@tanstack/react-query'

import { matchService } from '@/shared/api/services/matchService'

export function useAdminMatchesQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'matches', 'feed'],
    enabled,
    queryFn: () => matchService.listAllFeed(),
  })
}
