import { useQuery } from '@tanstack/react-query'

import { fetchTournaments } from '@/entities/tournament/api/tournamentApi'

export function useAdminTournamentsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'tournaments'],
    enabled,
    queryFn: () => fetchTournaments(),
  })
}
