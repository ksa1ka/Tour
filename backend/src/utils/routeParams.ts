import type { ParamsDictionary } from 'express-serve-static-core'

/** Express 5 types dynamic segments as `string | string[]`. */
export function routeParamString(params: ParamsDictionary, key: string): string | undefined {
  const v = params[key]
  if (typeof v === 'string' && v.length > 0) return v
  if (Array.isArray(v)) {
    const first = v[0]
    if (typeof first === 'string' && first.length > 0) return first
  }
  return undefined
}
