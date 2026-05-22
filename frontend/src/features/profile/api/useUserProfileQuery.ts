import { useQuery } from '@tanstack/react-query'

import { fetchUserProfile } from '@/entities/profile/api/profileApi'
import { useAuth } from '@/context/AuthContext'

import { profileQueryKeys } from './profileQueryKeys'

export function useUserProfileQuery(userId: string | undefined) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: profileQueryKeys.byUserId(userId ?? ''),
    queryFn: () => fetchUserProfile(userId as string),
    enabled: Boolean(accessToken && userId),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  })
}
