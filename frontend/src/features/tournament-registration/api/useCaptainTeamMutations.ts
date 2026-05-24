import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  registerCaptainTeam,
  updateCaptainTeam,
  withdrawCaptainTeam,
  type RegisterCaptainTeamPayload,
} from '@/features/tournament-registration/api/captainTeamApi'

export function useRegisterCaptainTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RegisterCaptainTeamPayload) => registerCaptainTeam(tournamentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    },
  })
}

export function useUpdateCaptainTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RegisterCaptainTeamPayload) => updateCaptainTeam(tournamentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    },
  })
}

export function useWithdrawCaptainTeamMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => withdrawCaptainTeam(tournamentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    },
  })
}
