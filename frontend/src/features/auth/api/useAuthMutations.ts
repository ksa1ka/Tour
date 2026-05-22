import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'

import { fetchProfile } from '@/entities/profile/api/profileApi'
import type { UserProfile } from '@/entities/profile/model/types'
import { type AuthUser, useAuth } from '@/context/AuthContext'
import { profileQueryKeys } from '@/features/profile/api/profileQueryKeys'
import { api } from '@/services/api'

export type AuthResponse = {
  accessToken: string
  user: AuthUser
}

export function useLoginMutation() {
  const { setSession, mergeUser } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/tournaments/matches'

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/login', input)
      return data
    },
    onSuccess: async (data) => {
      setSession(data.accessToken, data.user)
      try {
        await queryClient.prefetchQuery({
          queryKey: profileQueryKeys.all,
          queryFn: fetchProfile,
        })
        const profile = queryClient.getQueryData<UserProfile>(profileQueryKeys.all)
        if (profile) {
          mergeUser({ displayName: profile.displayName, avatarUrl: profile.avatarUrl })
        }
      } catch {
        // профиль не обязателен для навигации после входа
      }
      navigate(from, { replace: true })
    },
  })
}

export function useRegisterMutation() {
  const { setSession, mergeUser } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (input: { email: string; password: string; accountRole: 'VIEWER' | 'PLAYER' }) => {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        email: input.email,
        password: input.password,
        accountRole: input.accountRole,
      })
      return data
    },
    onSuccess: async (data) => {
      setSession(data.accessToken, data.user)
      try {
        await queryClient.prefetchQuery({
          queryKey: profileQueryKeys.all,
          queryFn: fetchProfile,
        })
        const profile = queryClient.getQueryData<UserProfile>(profileQueryKeys.all)
        if (profile) {
          mergeUser({ displayName: profile.displayName, avatarUrl: profile.avatarUrl })
        }
      } catch {
        // см. useLoginMutation
      }
      navigate('/tournaments/matches', { replace: true })
    },
  })
}

export function useLogoutMutation() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await logout()
    },
    onSettled: () => {
      queryClient.clear()
    },
  })
}
