import { z } from 'zod'

const DATA_IMAGE = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i
const HTTPS = /^https?:\/\//i

export function isValidStoredImageUrl(s: string): boolean {
  const t = s.trim()
  if (!t) return false
  if (/^\s*javascript:/i.test(t) || /^\s*vbscript:/i.test(t)) return false
  return HTTPS.test(t) || DATA_IMAGE.test(t)
}

const imageUrlMessage = 'Укажите http(s)-ссылку или data:image (png, jpeg, gif, webp) в base64'

/** Create payloads: missing / empty → null */
export function optionalImageUrlToNull(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string') return null
  return v.trim() || null
}

/** Update payloads: missing → undefined (no change); empty / null → clear */
export function optionalImageUrlForUpdate(v: unknown): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  if (typeof v !== 'string') return null
  return v.trim() || null
}

export function refineImageUrl(val: string | null | undefined, ctx: z.RefinementCtx, path: (string | number)[]) {
  if (val === undefined || val === null) return
  if (!isValidStoredImageUrl(val)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: imageUrlMessage, path })
  }
}
