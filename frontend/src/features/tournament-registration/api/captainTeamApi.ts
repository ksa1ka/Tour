import type { Team } from '@/entities/team/model/types'
import type { CaptainTeamRosterPlayer } from '@/features/tournament-registration/model/captainTeamFormSchema'
import { api } from '@/services/api'

export type RegisterCaptainTeamPayload = {
  name: string
  logo?: string | null
  players: CaptainTeamRosterPlayer[]
}

export async function registerCaptainTeam(tournamentId: string, payload: RegisterCaptainTeamPayload) {
  const { data } = await api.post<{ team: Team }>(`/tournaments/${tournamentId}/teams/register`, payload)
  return data.team
}

export async function updateCaptainTeam(tournamentId: string, payload: RegisterCaptainTeamPayload) {
  const { data } = await api.patch<{ team: Team }>(`/tournaments/${tournamentId}/teams/my`, payload)
  return data.team
}

export async function withdrawCaptainTeam(tournamentId: string) {
  await api.delete(`/tournaments/${tournamentId}/teams/my`)
}
