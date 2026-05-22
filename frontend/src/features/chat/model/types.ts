export type ChatScope = 'global' | 'tournament'

export type ChatMessage = {
  id: string
  scope: ChatScope
  tournamentId?: string
  userId?: string
  username: string
  avatarUrl?: string | null
  text: string
  createdAt: string
}

export type ChatHistoryEvent = {
  scope: ChatScope
  tournamentId?: string
  messages: ChatMessage[]
}

export type ChatTypingEvent = {
  scope: ChatScope
  tournamentId?: string
  username: string
  typing: boolean
}
