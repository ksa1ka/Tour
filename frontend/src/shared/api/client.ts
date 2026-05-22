import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

import { apiBaseURL } from '@/config/publicEnv'
import { getAuthSessionHandlers, refreshAccessTokenSingleFlight } from '@/services/authSessionBridge'

import { ApiError } from './errors'

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retryAfterRefresh?: boolean
  }
}

export const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const h = getAuthSessionHandlers()
  const token = h?.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(ApiError.fromUnknown(error))
    }

    const { config, response } = error
    const status = response?.status
    const url = (config as AxiosRequestConfig).url ?? ''

    if (status === 401 && !config._retryAfterRefresh) {
      const skipRefresh =
        url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register')
      if (!skipRefresh) {
        const ok = await refreshAccessTokenSingleFlight()
        if (ok) {
          const nextConfig = { ...config, _retryAfterRefresh: true } as InternalAxiosRequestConfig
          const hAfter = getAuthSessionHandlers()
          const token = hAfter?.getAccessToken()
          if (token) {
            nextConfig.headers = nextConfig.headers ?? {}
            nextConfig.headers.Authorization = `Bearer ${token}`
          }
          return api(nextConfig)
        }
      }
    }

    return Promise.reject(ApiError.fromUnknown(error))
  },
)
