const DATA_IMAGE = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i
const HTTPS = /^https?:\/\//i

/** Rejects javascript: and other non-image schemes; allows http(s) and safe data:image base64 prefixes. */
export function isAllowedImageSrc(raw: string | null | undefined): boolean {
  if (raw == null) return false
  const s = raw.trim()
  if (!s) return false
  if (/^\s*javascript:/i.test(s) || /^\s*vbscript:/i.test(s)) return false
  return HTTPS.test(s) || DATA_IMAGE.test(s)
}
