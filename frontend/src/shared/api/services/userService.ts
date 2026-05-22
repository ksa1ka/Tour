import type { AuthUser } from '@/context/AuthContext'

import { api } from '../client'

export type UpdateUserProfilePayload = Partial<{
  email: string
}>

export const userService = {
  /** Профиль текущего пользователя (маршрут появится на backend). */
  getMe() {
    return api.get<{ user: AuthUser }>('/users/me').then((r) => r.data.user)
  },

  updateMe(payload: UpdateUserProfilePayload) {
    return api.patch<{ user: AuthUser }>('/users/me', payload).then((r) => r.data.user)
  },
}
