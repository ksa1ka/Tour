import { useAuth } from '@/context/AuthContext'

export function useIsPlayer() {
  const { user } = useAuth()
  return user?.role === 'PLAYER'
}
