import { TournamentList } from '@/features/tournament-list/ui/TournamentList'
import { PageContainer } from '@/shared/ui/PageContainer'

/** Явный выбор турнира для фэнтези (список карточек). */
export function TournamentFantasyPickPage() {
  return (
    <PageContainer
      title="Фэнтези-лига"
      description="Выберите турнир, чтобы собрать состав, следить за очками и соревноваться в фэнтези по конкретному событию."
      tagline="Турниры"
    >
      <TournamentList tournamentHref={(id) => `/tournaments/${id}/fantasy?focus=roster`} actionLabel="Играть в фэнтези" />
    </PageContainer>
  )
}
