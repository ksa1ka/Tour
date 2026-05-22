import type { ChatMessagePayload } from './chatTypes.js'

const MAX_MESSAGES = 80

const globalMessages: ChatMessagePayload[] = []
const tournamentMessages = new Map<string, ChatMessagePayload[]>()

function pushRing(buffer: ChatMessagePayload[], msg: ChatMessagePayload) {
  buffer.push(msg)
  if (buffer.length > MAX_MESSAGES) {
    buffer.splice(0, buffer.length - MAX_MESSAGES)
  }
}

export function appendChatMessage(msg: ChatMessagePayload) {
  if (msg.scope === 'global') {
    pushRing(globalMessages, msg)
    return
  }
  const tid = msg.tournamentId
  if (!tid) return
  const list = tournamentMessages.get(tid) ?? []
  pushRing(list, msg)
  tournamentMessages.set(tid, list)
}

export function getChatHistory(scope: 'global', tournamentId?: undefined): ChatMessagePayload[]
export function getChatHistory(scope: 'tournament', tournamentId: string): ChatMessagePayload[]
export function getChatHistory(scope: 'global' | 'tournament', tournamentId?: string): ChatMessagePayload[] {
  if (scope === 'global') return [...globalMessages]
  if (!tournamentId) return []
  return [...(tournamentMessages.get(tournamentId) ?? [])]
}
