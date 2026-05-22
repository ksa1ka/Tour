import axios from 'axios'

import { ApiError } from '@/shared/api/errors'

/** Сообщение для UI при ошибке login/register (axios / ApiError / сеть). */
export function getAuthRequestErrorMessage(error: unknown, context: 'login' | 'register'): string {
  if (error instanceof ApiError) {
    if (error.isRetryable && (!error.status || error.code === 'ERR_NETWORK')) {
      return 'Сервер API недоступен. Запустите backend: в каталоге `backend` выполните `npm run dev` (порт 4000), затем обновите страницу. Либо из корня репозитория: `npm install` и `npm run dev`.'
    }
    const st = error.status
    if (st === 409 && context === 'register') {
      return error.message !== 'Ресурс не найден.' ? error.message : 'Этот email уже зарегистрирован.'
    }
    if (st === 400) {
      return error.message && error.message !== 'Ресурс не найден.'
        ? error.message
        : 'Проверьте данные формы.'
    }
    if (st === 401 && context === 'login') {
      return error.message !== 'Ресурс не найден.' ? error.message : 'Неверный email или пароль.'
    }
    if (st !== undefined && st >= 500) {
      return error.message
    }
    return error.message
  }

  if (!axios.isAxiosError(error)) {
    return 'Произошла ошибка. Попробуйте ещё раз.'
  }

  const res = error.response
  const noApi =
    !res ||
    res.status === 502 ||
    res.status === 503 ||
    res.status === 504 ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNREFUSED' ||
    error.message === 'Network Error'

  if (noApi) {
    return 'Сервер API недоступен. Запустите backend: в каталоге `backend` выполните `npm run dev` (порт 4000), затем обновите страницу. Либо из корня репозитория: `npm install` и `npm run dev`.'
  }

  const st = res.status
  const data = res.data as { error?: string; details?: { fieldErrors?: Record<string, string[] | undefined> } } | undefined
  let zodField: string | undefined
  if (data?.details?.fieldErrors) {
    for (const msgs of Object.values(data.details.fieldErrors)) {
      if (Array.isArray(msgs) && typeof msgs[0] === 'string') {
        zodField = msgs[0]
        break
      }
    }
  }
  const serverMsg = zodField ?? (typeof data?.error === 'string' ? data.error : undefined)

  if (st === 409 && context === 'register') {
    return serverMsg ?? 'Этот email уже зарегистрирован.'
  }
  if (st === 400) {
    return serverMsg && serverMsg !== 'Ресурс не найден.' ? serverMsg : 'Проверьте данные формы.'
  }
  if (st === 401 && context === 'login') {
    return serverMsg ?? 'Неверный email или пароль.'
  }
  if (st >= 500) {
    return serverMsg ?? 'Не удалось выполнить запрос. Попробуйте позже.'
  }
  return serverMsg ?? 'Запрос не выполнен. Попробуйте ещё раз.'
}
