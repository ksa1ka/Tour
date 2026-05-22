import axios from 'axios'

export type ApiErrorBody = {
  error?: string
  message?: string
}

function readServerMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const o = data as ApiErrorBody
  if (typeof o.error === 'string') return o.error
  if (typeof o.message === 'string') return o.message
  return undefined
}

/** Первое сообщение из Zod `flatten()` в теле ответа API (`details`). */
function readZodFlattenFirstMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const details = (data as { details?: unknown }).details
  if (!details || typeof details !== 'object') return undefined
  const fieldErrors = (details as { fieldErrors?: Record<string, string[] | undefined> }).fieldErrors
  if (fieldErrors) {
    for (const msgs of Object.values(fieldErrors)) {
      if (Array.isArray(msgs) && typeof msgs[0] === 'string') return msgs[0]
    }
  }
  const formErrors = (details as { formErrors?: string[] }).formErrors
  if (Array.isArray(formErrors) && typeof formErrors[0] === 'string') return formErrors[0]
  return undefined
}

export class ApiError extends Error {
  readonly status?: number
  readonly code?: string
  readonly isRetryable: boolean
  readonly raw?: unknown

  constructor(message: string, options?: { status?: number; code?: string; isRetryable?: boolean; raw?: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.code = options?.code
    this.isRetryable = options?.isRetryable ?? false
    this.raw = options?.raw
  }

  static fromUnknown(error: unknown, fallback = 'Запрос не выполнен. Попробуйте ещё раз.'): ApiError {
    if (error instanceof ApiError) return error

    if (!axios.isAxiosError(error)) {
      return new ApiError(fallback, { isRetryable: false, raw: error })
    }

    const res = error.response
    const status = res?.status
    const data = res?.data
    const zodMsg = readZodFlattenFirstMessage(data)
    const serverMsg = zodMsg ?? readServerMessage(data)
    const isNetwork = !res || error.code === 'ERR_NETWORK' || error.message === 'Network Error'

    let message = fallback
    if (isNetwork) {
      message = 'Сервер недоступен. Проверьте, что backend запущен, и попробуйте снова.'
    } else if (serverMsg) {
      message = serverMsg
    } else if (status === 403) {
      message = 'Недостаточно прав для этого действия.'
    } else if (status === 404) {
      message = 'Ресурс не найден.'
    } else if (status !== undefined && status >= 500) {
      message = 'Не удалось выполнить запрос. Попробуйте позже.'
    }

    return new ApiError(message, {
      status,
      code: error.code,
      isRetryable: isRetryableHttpStatus(status, error),
      raw: error,
    })
  }
}

export function isRetryableHttpStatus(status: number | undefined, error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  if (!error.response) return true
  if (status === undefined) return false
  if (status === 408 || status === 429) return true
  if (status >= 500 && status !== 501) return true
  return false
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
