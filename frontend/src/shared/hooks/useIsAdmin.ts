import { useAuth } from '@/context/AuthContext'

export function useIsAdmin() {
  const { user } = useAuth()
  return user?.role === 'ADMIN'
}
