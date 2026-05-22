import { useQuery } from '@tanstack/react-query'

import { teamTournamentHistoryService } from '@/shared/api/services/teamTournamentHistoryService'

export function teamTournamentHistoryQueryKey(tournamentId: string, teamId: string | null) {
  return ['team-tournament-history', tournamentId, teamId] as const
}

export function useTeamTournamentHistory(tournamentId: string, teamId: string | null, open: boolean) {
  return useQuery({
    queryKey: teamTournamentHistoryQueryKey(tournamentId, teamId),
    queryFn: () => teamTournamentHistoryService.getByTeam(tournamentId, teamId!),
    enabled: open && Boolean(teamId),
    staleTime: 10_000,
  })
}
