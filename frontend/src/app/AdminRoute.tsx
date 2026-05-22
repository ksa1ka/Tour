import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'

/** Доступ только для пользователей с ролью ADMIN. */
export function AdminRoute() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/tournaments/matches" replace />
  }

  return <Outlet />
}
