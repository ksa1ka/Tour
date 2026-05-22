import axios from 'axios'

import { ApiError, isRetryableHttpStatus } from './errors'

const MAX_QUERY_RETRIES = 3

/** TanStack Query: retry only for transient failures (network, timeouts, 5xx). */
export function queryShouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false

  if (error instanceof ApiError) {
    return error.isRetryable
  }

  if (axios.isAxiosError(error)) {
    return isRetryableHttpStatus(error.response?.status, error)
  }

  return false
}

export function queryRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30_000)
}
