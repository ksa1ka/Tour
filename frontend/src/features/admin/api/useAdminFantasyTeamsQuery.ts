import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api'

export type AdminFantasyTeamListItem = {
  id: string
  fantasyTeamName: string | null
  points: number
  tournamentId: string
  tournamentTitle: string
  userId: string
  userEmail: string
  userDisplayName: string | null
  updatedAt: string
}

type Response = { fantasyTeams: AdminFantasyTeamListItem[] }

export function useAdminFantasyTeamsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'fantasy-teams'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<Response>('/admin/fantasy-teams')
      return data.fantasyTeams
    },
  })
}
