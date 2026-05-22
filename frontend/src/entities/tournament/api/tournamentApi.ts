import { tournamentService } from '@/shared/api/services/tournamentService'
import type { TournamentGame } from '@/entities/tournament/model/types'

export type { CreateTournamentPayload, UpdateTournamentPayload } from '@/shared/api/services/tournamentService'

export const fetchTournaments = (params?: { game?: TournamentGame }) => tournamentService.list(params)

export const fetchTournament = (id: string) => tournamentService.getById(id)

export const createTournament = tournamentService.create.bind(tournamentService)

export const updateTournament = tournamentService.update.bind(tournamentService)

export const deleteTournament = tournamentService.remove.bind(tournamentService)
