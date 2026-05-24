import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  addPlayerToTeam,
  removePlayerFromTeam,
  updatePlayerInTeam,
  type CreatePlayerPayload,
  type UpdatePlayerPayload,
} from '@/entities/team/api/teamApi'

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

export function useUpdatePlayerMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      teamId,
      playerId,
      payload,
    }: {
      teamId: string
      playerId: string
      payload: UpdatePlayerPayload
    }) => updatePlayerInTeam(tournamentId, teamId, playerId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['teams'] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
    },
  })
}
