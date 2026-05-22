/** API origin without trailing slash (Railway). Empty in dev → Vite proxy `/api`. */
const rawApi = import.meta.env.VITE_API_URL as string | undefined

export const apiOrigin = rawApi?.replace(/\/$/, '') ?? ''

export const apiBaseURL = apiOrigin ? `${apiOrigin}/api` : '/api'

/** Socket.io connects here; empty = same origin as the page (dev proxy). */
export const socketOrigin = apiOrigin
