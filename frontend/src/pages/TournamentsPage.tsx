import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { TournamentList } from '@/features/tournament-list/ui/TournamentList'
import { useIsAdmin } from '@/shared/hooks/useIsAdmin'
import { PageContainer } from '@/shared/ui/PageContainer'

export function TournamentsPage() {
  const isAdmin = useIsAdmin()

  return (
    <PageContainer
      title="Интерактивная сетка"
      description="Выберите турнир из списка: откроется сетка на выбывание, счёт и чат обновляются сами, пока вы на странице."
      tagline="Соревнования"
      actions={
        isAdmin ? (
          <Button asChild variant="outline" className="gap-2">
            <Link to="/tournaments/new">
              <Plus className="h-4 w-4" />
              Новый турнир
            </Link>
          </Button>
        ) : undefined
      }
    >
      <TournamentList />
    </PageContainer>
  )
}
