import { ApiError } from '@/shared/api/errors'

/** Сообщение об ошибке из ответа REST API (axios / ApiError). */
export function getRestErrorMessage(error: unknown, fallback = 'Запрос не выполнен. Попробуйте ещё раз.'): string {
  return ApiError.fromUnknown(error, fallback).message
}
