import { teamService } from '@/shared/api/services/teamService'

export type { CreatePlayerPayload, CreateTeamPayload, UpdateTeamPayload } from '@/shared/api/services/teamService'

export const fetchTeams = (params?: { tournamentId?: string }) => teamService.list(params)

export const fetchTeamsByTournament = (tournamentId: string) => teamService.listByTournament(tournamentId)

export const createTeam = teamService.create.bind(teamService)

export const updateTeam = teamService.update.bind(teamService)

export const deleteTeam = teamService.remove.bind(teamService)

export const addPlayerToTeam = teamService.addPlayer.bind(teamService)

export const removePlayerFromTeam = teamService.removePlayer.bind(teamService)
