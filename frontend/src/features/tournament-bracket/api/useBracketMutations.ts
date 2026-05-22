import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  matchService,
  type SetBracketWinnerPayload,
  type SwapBracketTeamSlotsPayload,
  type UpdateMatchResultPayload,
} from '@/shared/api/services/matchService'

export function useGenerateBracketMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teamIds: string[]) => matchService.generateBracket(tournamentId, teamIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['team-tournament-history', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-leaderboard', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-me', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-board', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-history', tournamentId] })
    },
  })
}

export function useSetBracketMatchWinnerMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      matchId,
      payload,
    }: {
      matchId: string
      payload: SetBracketWinnerPayload
    }) => matchService.setBracketWinner(tournamentId, matchId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['team-tournament-history', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-leaderboard', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-me', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-board', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-history', tournamentId] })
    },
  })
}

export function useClearMatchResultMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (matchId: string) => matchService.updateResult(tournamentId, matchId, { mode: 'clear' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['team-tournament-history', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-leaderboard', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-me', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-board', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-history', tournamentId] })
    },
  })
}

export function useSwapBracketTeamSlotsMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SwapBracketTeamSlotsPayload) => matchService.swapBracketTeamSlots(tournamentId, payload),
    onSuccess: (matches) => {
      queryClient.setQueryData(['bracket-matches', tournamentId], matches)
      void queryClient.invalidateQueries({ queryKey: ['team-tournament-history', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-leaderboard', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-me', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-board', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-history', tournamentId] })
    },
  })
}

export function useUpdateMatchResultMutation(tournamentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      matchId,
      payload,
    }: {
      matchId: string
      payload: UpdateMatchResultPayload
    }) => matchService.updateResult(tournamentId, matchId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bracket-matches', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['team-tournament-history', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-leaderboard', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-me', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-board', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-history', tournamentId] })
    },
  })
}
