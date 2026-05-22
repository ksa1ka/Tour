import type { Team } from '@/entities/team/model/types'

import { TournamentBracket } from './TournamentBracket'

type TournamentBracketPanelProps = {
  tournamentId: string
  format: string
  isAdmin: boolean
  teams: Team[]
}

/** Панель турнирной сетки на странице турнира (выбывание). */
export function TournamentBracketPanel({ tournamentId, format, isAdmin, teams }: TournamentBracketPanelProps) {
  return <TournamentBracket tournamentId={tournamentId} format={format} isAdmin={isAdmin} teams={teams} />
}
