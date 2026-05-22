import type { Team } from '@/entities/team/model/types'

import { api } from '../client'

export type CreateTeamPayload = {
  name: string
  logo?: string | null
}

export type UpdateTeamPayload = Partial<{
  name: string
  logo: string | null
}>

export type CreatePlayerPayload = {
  nickname: string
  realName?: string | null
  role: string
  country?: string | null
  avatar?: string | null
  isStarter?: boolean
}

export const teamService = {
  list(params?: { tournamentId?: string }) {
    const search = params?.tournamentId ? `?tournamentId=${encodeURIComponent(params.tournamentId)}` : ''
    return api.get<{ teams: Team[] }>(`/teams${search}`).then((r) => r.data.teams)
  },

  listByTournament(tournamentId: string) {
    return api.get<{ teams: Team[] }>(`/tournaments/${tournamentId}/teams`).then((r) => r.data.teams)
  },

  create(tournamentId: string, payload: CreateTeamPayload) {
    return api.post<{ team: Team }>(`/tournaments/${tournamentId}/teams`, payload).then((r) => r.data.team)
  },

  update(tournamentId: string, teamId: string, payload: UpdateTeamPayload) {
    return api
      .patch<{ team: Team }>(`/tournaments/${tournamentId}/teams/${teamId}`, payload)
      .then((r) => r.data.team)
  },

  remove(tournamentId: string, teamId: string) {
    return api.delete(`/tournaments/${tournamentId}/teams/${teamId}`).then(() => undefined)
  },

  addPlayer(tournamentId: string, teamId: string, payload: CreatePlayerPayload) {
    return api
      .post<{ team: Team }>(`/tournaments/${tournamentId}/teams/${teamId}/players`, payload)
      .then((r) => r.data.team)
  },

  removePlayer(tournamentId: string, teamId: string, playerId: string) {
    return api
      .delete<{ team: Team }>(`/tournaments/${tournamentId}/teams/${teamId}/players/${playerId}`)
      .then((r) => r.data.team)
  },
}
