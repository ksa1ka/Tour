export type TeamTournamentRef = {
  id: string
  title: string
  avatarUrl: string | null
}

export type Player = {
  id: string
  nickname: string
  realName: string | null
  avatar: string | null
  country: string | null
  role: string
  isStarter: boolean
  createdAt: string
  updatedAt: string
}

export type Team = {
  id: string
  name: string
  logo: string | null
  tournamentId: string
  captainId: string | null
  createdAt: string
  updatedAt: string
  tournament: TeamTournamentRef
  players: Player[]
}
