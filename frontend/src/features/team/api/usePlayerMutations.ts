import { useMutation, useQueryClient } from '@tanstack/react-query'

import { addPlayerToTeam, removePlayerFromTeam, type CreatePlayerPayload } from '@/entities/team/api/teamApi'

export function useAddPlayerMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: CreatePlayerPayload }) =>
      addPlayerToTeam(tournamentId, teamId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['teams'] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
    },
  })
}

export function useRemovePlayerMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, playerId }: { teamId: string; playerId: string }) =>
      removePlayerFromTeam(tournamentId, teamId, playerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['teams'] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
    },
  })
}
