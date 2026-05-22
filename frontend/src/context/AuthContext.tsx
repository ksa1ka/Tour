import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { registerAuthSessionHandlers, notifyServerLogout } from '@/services/authSessionBridge'
import { disconnectSocket } from '@/services/socket'

export type UserRole = 'ADMIN' | 'VIEWER' | 'PLAYER'

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  displayName?: string | null
  avatarUrl?: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  setSession: (accessToken: string, user: AuthUser) => void
  setAccessToken: (accessToken: string) => void
  mergeUser: (patch: Partial<Pick<AuthUser, 'displayName' | 'avatarUrl' | 'role'>>) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ACCESS_KEY = 'tour_access_token'
const USER_KEY = 'tour_user'
const LEGACY_TOKEN_KEY = 'tour_token'
const LEGACY_REFRESH_KEY = 'tour_refresh_token'

function normalizeAuthUser(user: AuthUser): AuthUser {
  return {
    ...user,
    displayName: user.displayName?.trim() || null,
    avatarUrl: user.avatarUrl?.trim() || null,
  }
}

function readStoredSession(): {
  accessToken: string | null
  user: AuthUser | null
} {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    localStorage.removeItem(LEGACY_REFRESH_KEY)
    const accessToken = localStorage.getItem(ACCESS_KEY)
    const raw = localStorage.getItem(USER_KEY)
    if (!accessToken || !raw) {
      return { accessToken: null, user: null }
    }
    const user = JSON.parse(raw) as AuthUser
    const normalized = normalizeAuthUser({
      ...user,
      displayName: user.displayName ?? null,
      avatarUrl: user.avatarUrl ?? null,
    })
    return { accessToken, user: normalized }
  } catch {
    return { accessToken: null, user: null }
  }
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initial = readStoredSession()
  const [{ accessToken, user }, setState] = useState(initial)

  const accessRef = useRef<string | null>(initial.accessToken)

  const setSession = useCallback((nextAccess: string, nextUser: AuthUser) => {
    const userNorm = normalizeAuthUser(nextUser)
    const prevToken = accessRef.current
    localStorage.setItem(ACCESS_KEY, nextAccess)
    localStorage.setItem(USER_KEY, JSON.stringify(userNorm))
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    localStorage.removeItem(LEGACY_REFRESH_KEY)
    accessRef.current = nextAccess
    if (prevToken !== nextAccess) {
      disconnectSocket()
    }
    setState({ accessToken: nextAccess, user: userNorm })
  }, [])

  const setAccessToken = useCallback((nextAccess: string) => {
    localStorage.setItem(ACCESS_KEY, nextAccess)
    accessRef.current = nextAccess
    setState((prev) => ({
      ...prev,
      accessToken: nextAccess,
    }))
  }, [])

  const mergeUser = useCallback((patch: Partial<Pick<AuthUser, 'displayName' | 'avatarUrl' | 'role'>>) => {
    setState((prev) => {
      if (!prev.user) return prev
      const nextUser = normalizeAuthUser({ ...prev.user, ...patch })
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      return { ...prev, user: nextUser }
    })
  }, [])

  const clearLocalSession = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    localStorage.removeItem(LEGACY_REFRESH_KEY)
    accessRef.current = null
    disconnectSocket()
    setState({ accessToken: null, user: null })
  }, [])

  const logout = useCallback(async () => {
    await notifyServerLogout()
    clearLocalSession()
  }, [clearLocalSession])

  useLayoutEffect(() => {
    registerAuthSessionHandlers({
      getAccessToken: () => accessRef.current,
      setAccessToken,
      setSession,
      clearSession: clearLocalSession,
    })
  }, [setAccessToken, setSession, clearLocalSession])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      setSession,
      setAccessToken,
      mergeUser,
      logout,
    }),
    [user, accessToken, setSession, setAccessToken, mergeUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
