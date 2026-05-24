import type { AuthUser } from '@/context/AuthContext'

import { api } from '../client'

export type AuthSessionResponse = {
  accessToken: string
  user: AuthUser
}

export const authService = {
  login(body: { email: string; password: string }) {
    return api.post<AuthSessionResponse>('/auth/login', body).then((r) => r.data)
  },

  register(body: { email: string; password: string; accountRole: 'VIEWER' | 'PLAYER' }) {
    return api.post<AuthSessionResponse>('/auth/register', body).then((r) => r.data)
  },

  refresh() {
    return api.post<{ accessToken: string }>('/auth/refresh', {}).then((r) => r.data)
  },

  logout() {
    return api.post<void>('/auth/logout').then(() => undefined)
  },
}
