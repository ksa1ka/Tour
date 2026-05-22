import { useEffect } from 'react'

import { useAuth } from '@/context/AuthContext'

import { useProfileQuery } from './useProfileQuery'

/** Один раз на layout: подтянуть профиль в сессию (шапка, аватар) после входа и при refetch API. */
export function useProfileAuthSync() {
  const { user, mergeUser } = useAuth()
  const { data: profile } = useProfileQuery()

  useEffect(() => {
    if (!profile || !user || profile.id !== user.id) return

    const nextAvatar = profile.avatarUrl?.trim() || null
    const nextName = profile.displayName?.trim() || null
    const curAvatar = user.avatarUrl?.trim() || null
    const curName = user.displayName?.trim() || null

    const patch: Partial<{ displayName: string | null; avatarUrl: string | null; role: typeof user.role }> = {}
    if (nextAvatar !== curAvatar) patch.avatarUrl = profile.avatarUrl
    if (nextName !== curName) patch.displayName = profile.displayName
    if (profile.role !== user.role) patch.role = profile.role as typeof user.role
    if (Object.keys(patch).length > 0) mergeUser(patch)
  }, [profile, user, mergeUser])
}
