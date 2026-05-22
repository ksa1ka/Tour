import { useQuery } from '@tanstack/react-query'
import { Inbox, WifiOff } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { fetchTournaments } from '@/entities/tournament/api/tournamentApi'
import { pickDefaultFantasyTournamentId } from '@/shared/lib/pickFantasyTournament'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageLoader } from '@/shared/ui/PageLoader'

/** Точка входа «Фэнтези-лига»: сразу ведёт на сбор состава выбранного по умолчанию турнира. */
export function TournamentFantasyHubPage() {
  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => fetchTournaments(),
  })

  if (isPending) {
    return (
      <PageContainer title="Фэнтези-лига" tagline="Турниры">
        <PageLoader message="Загрузка фэнтези…" />
      </PageContainer>
    )
  }

  if (isError) {
    return (
      <PageContainer title="Фэнтези-лига" tagline="Турниры">
        <EmptyState
          icon={WifiOff}
          title="Не удалось загрузить"
          description="Проверьте интернет-соединение и попробуйте снова."
          action={
            <Button type="button" variant="outline" disabled={isRefetching} onClick={() => void refetch()}>
              {isRefetching ? 'Запрос…' : 'Повторить'}
            </Button>
          }
        />
      </PageContainer>
    )
  }

  if (!data?.length) {
    return (
      <PageContainer title="Фэнтези-лига" tagline="Турниры">
        <EmptyState
          icon={Inbox}
          title="Пока нет турниров"
          description="Когда появится турнир, фэнтези откроется автоматически. Матчи и список турниров доступны из шапки."
          action={
            <Button asChild variant="outline">
              <Link to="/tournaments/matches">Матчи и результаты</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const id = pickDefaultFantasyTournamentId(data)

  if (!id) {
    return <Navigate to="/tournaments/fantasy/pick" replace />
  }

  return <Navigate to={`/tournaments/${id}/fantasy?focus=roster`} replace />
}
