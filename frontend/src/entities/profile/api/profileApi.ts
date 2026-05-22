import { api } from '@/services/api'

import type { PublicUserProfile, UserProfile } from '../model/types'

export type ProfileUpdatePayload = {
  displayName?: string | null
  bio?: string | null
  avatarUrl?: string | null
}

export async function fetchProfile(): Promise<UserProfile> {
  const { data } = await api.get<{ profile: UserProfile }>('/profile')
  return data.profile
}

export async function fetchUserProfile(userId: string): Promise<PublicUserProfile> {
  const { data } = await api.get<{ profile: PublicUserProfile }>(`/users/${userId}/profile`)
  return data.profile
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<UserProfile> {
  const { data } = await api.patch<{ profile: UserProfile }>('/profile', payload)
  return data.profile
}
