import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createTeam,
  deleteTeam,
  updateTeam,
  type CreateTeamPayload,
  type UpdateTeamPayload,
} from '@/entities/team/api/teamApi'

export function useCreateTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => createTeam(tournamentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['teams'] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    },
  })
}

export function useUpdateTeamMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tournamentId,
      teamId,
      payload,
    }: {
      tournamentId: string
      teamId: string
      payload: UpdateTeamPayload
    }) => updateTeam(tournamentId, teamId, payload),
    onSuccess: (_data, { tournamentId }) => {
      void queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['teams'] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    },
  })
}

export function useDeleteTeamMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tournamentId, teamId }: { tournamentId: string; teamId: string }) =>
      deleteTeam(tournamentId, teamId),
    onSuccess: (_data, { tournamentId }) => {
      void queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['teams'] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    },
  })
}
