import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createTournament,
  deleteTournament,
  updateTournament,
  type CreateTournamentPayload,
  type UpdateTournamentPayload,
} from '@/entities/tournament/api/tournamentApi'

export function useCreateTournamentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTournamentPayload) => createTournament(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    },
  })
}

export function useUpdateTournamentMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateTournamentPayload) => updateTournament(id, payload),
    onSuccess: (tournament) => {
      void queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] })
    },
  })
}

export function useDeleteTournamentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tournamentId: string) => deleteTournament(tournamentId),
    onSuccess: (_data, tournamentId) => {
      void queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      void queryClient.removeQueries({ queryKey: ['tournament', tournamentId] })
    },
  })
}
