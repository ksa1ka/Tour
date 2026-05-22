export type ChatScope = 'global' | 'tournament'

export type ChatMessagePayload = {
  id: string
  scope: ChatScope
  tournamentId?: string
  userId?: string
  username: string
  avatarUrl?: string | null
  text: string
  createdAt: string
}

export type ChatTypingPayload = {
  scope: ChatScope
  tournamentId?: string
  username: string
  typing: boolean
}

export function chatRoomName(scope: ChatScope, tournamentId?: string) {
  if (scope === 'global') return 'chat:global'
  if (!tournamentId) return null
  return `chat:tournament:${tournamentId}`
}

export function usernameFromSocket(email: string | undefined) {
  if (!email?.trim()) return 'Гость'
  const local = email.split('@')[0]?.trim()
  return local || email
}

export function chatDisplayName(email: string | undefined, displayName: string | null | undefined) {
  if (displayName?.trim()) return displayName.trim()
  return usernameFromSocket(email)
}
