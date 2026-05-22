import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/context/AuthContext'
import { type ProfileUpdatePayload, updateProfile } from '@/entities/profile/api/profileApi'

import { profileQueryKeys } from './profileQueryKeys'

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  const { mergeUser } = useAuth()

  return useMutation({
    mutationFn: (payload: ProfileUpdatePayload) => updateProfile(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.all, profile)
      mergeUser({ displayName: profile.displayName, avatarUrl: profile.avatarUrl })
    },
  })
}
