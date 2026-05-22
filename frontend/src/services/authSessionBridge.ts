import axios from 'axios'

import { apiBaseURL } from '@/config/publicEnv'
import type { AuthUser } from '@/context/AuthContext'

export type AuthSessionHandlers = {
  getAccessToken: () => string | null
  setAccessToken: (accessToken: string) => void
  setSession: (accessToken: string, user: AuthUser) => void
  clearSession: () => void
}

let handlers: AuthSessionHandlers | null = null

/** Called from `AuthProvider` so API interceptors can refresh and clear session. */
export function registerAuthSessionHandlers(next: AuthSessionHandlers) {
  handlers = next
}

export function getAuthSessionHandlers() {
  return handlers
}

const refreshClient = axios.create({
  baseURL: apiBaseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let refreshInFlight: Promise<boolean> | null = null

async function runRefresh(): Promise<boolean> {
  const h = handlers
  if (!h) return false
  try {
    const { data } = await refreshClient.post<{ accessToken: string; user: AuthUser }>('/auth/refresh', {})
    h.setSession(data.accessToken, data.user)
    return true
  } catch {
    h.clearSession()
    return false
  }
}

/** Single-flight refresh for concurrent 401s */
export function refreshAccessTokenSingleFlight(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = runRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export async function notifyServerLogout() {
  try {
    await refreshClient.post('/auth/logout')
  } catch {
    // ignore — client session is cleared regardless
  }
}
