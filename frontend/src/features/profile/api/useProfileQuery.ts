import { useQuery } from '@tanstack/react-query'

import { fetchProfile } from '@/entities/profile/api/profileApi'
import { useAuth } from '@/context/AuthContext'

import { profileQueryKeys } from './profileQueryKeys'

/**
 * Профиль с сервера. staleTime: 0 + refetchOnMount — при переходе между разделами данные не залипают в устаревшем кэше.
 * Синхронизация displayName/avatarUrl в localStorage/шапку — в `useProfileAuthSync` (RootLayout).
 */
export function useProfileQuery() {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: profileQueryKeys.all,
    queryFn: fetchProfile,
    enabled: Boolean(accessToken),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  })
}