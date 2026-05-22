import type {
  CreatableTournamentFormat,
  Tournament,
  TournamentDetail,
  FantasyPredictionType,
  TournamentFormatConfig,
  TournamentGame,
} from '@/entities/tournament/model/types'

import { api } from '../client'

export type CreateTournamentPayload = {
  title: string
  description?: string | null
  avatarUrl?: string | null
  game: TournamentGame
  format: CreatableTournamentFormat
  formatConfig?: TournamentFormatConfig
  status?: Tournament['status']
}

export type UpdateTournamentPayload = Partial<{
  title: string
  description: string | null
  avatarUrl: string | null
  game: TournamentGame
  format: CreatableTournamentFormat
  formatConfig: TournamentFormatConfig | null
  status: Tournament['status']
  fantasyActivePredictions: FantasyPredictionType[]
}>

export const tournamentService = {
  list(params?: { game?: TournamentGame }) {
    const qs = params?.game ? `?game=${encodeURIComponent(params.game)}` : ''
    return api.get<{ tournaments: Tournament[] }>(`/tournaments${qs}`).then((r) => r.data.tournaments)
  },

  getById(id: string) {
    return api.get<{ tournament: TournamentDetail }>(`/tournaments/${id}`).then((r) => r.data.tournament)
  },

  create(payload: CreateTournamentPayload) {
    return api.post<{ tournament: Tournament }>('/tournaments', payload).then((r) => r.data.tournament)
  },

  update(id: string, payload: UpdateTournamentPayload) {
    return api.patch<{ tournament: Tournament }>(`/tournaments/${id}`, payload).then((r) => r.data.tournament)
  },

  remove(id: string) {
    return api.delete(`/tournaments/${id}`).then(() => undefined)
  },
}
