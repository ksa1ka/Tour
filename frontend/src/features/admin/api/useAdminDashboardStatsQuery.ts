import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api'

export type AdminDashboardStats = {
  users: {
    total: number
    last30Days: number
    previous30Days: number
    changePercent: number | null
    byRole: { admin: number; player: number; viewer: number }
  }
  tournaments: {
    total: number
    active: number
    createdLast30Days: number
    byStatus: Record<string, number>
  }
  matches: {
    total: number
    played: number
    scheduled: number
  }
  teams: { total: number }
  fantasy: {
    fantasyTeams: number
    uniqueParticipants: number
    tournamentsWithFantasy: number
    predictions: number
    usersWithPredictions: number
    createdLast30Days: number
    previous30Days: number
    changePercent: number | null
  }
  shop: {
    rewards: number
    purchases: number
    totalQuantitySold: number
  }
  activityByDay: {
    date: string
    newUsers: number
    newFantasyTeams: number
    newTeams: number
  }[]
  fantasyFunnel: {
    totalUsers: number
    withFantasyTeam: number
    withPredictions: number
    tournamentsWithFantasy: number
  }
  generatedAt: string
}

type AdminDashboardStatsResponse = {
  stats: AdminDashboardStats
}

export function useAdminDashboardStatsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'stats'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<AdminDashboardStatsResponse>('/admin/stats')
      return data.stats
    },
    staleTime: 30_000,
  })
}
