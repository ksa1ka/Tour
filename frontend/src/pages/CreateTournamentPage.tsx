import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { TournamentForm } from '@/features/tournament-form/ui/TournamentForm'
import { useCreateTournamentMutation } from '@/features/tournament/api/useTournamentMutations'
import { formatConfigFromForm } from '@/shared/lib/formatConfigPayload'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { PageContainer } from '@/shared/ui/PageContainer'

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const createMutation = useCreateTournamentMutation()
  const [serverError, setServerError] = useState<string | null>(null)

  return (
    <PageContainer
      title="Новый турнир"
      description="Выберите формат: олимпийская сетка, круговая система или швейцарка. Статус можно сменить позже."
      tagline="Турниры"
      variant="narrow"
    >
      <div className="glass-panel rounded-lg p-6 shadow-md">
        {serverError ? <p className="mb-4 text-sm text-destructive">{serverError}</p> : null}
        <TournamentForm
          defaultValues={{
            title: '',
            description: '',
            avatarUrl: '',
            game: 'VALORANT',
            format: 'SINGLE_ELIMINATION',
            status: 'DRAFT',
            swissRounds: undefined,
          }}
          submitLabel="Создать турнир"
          isSubmitting={createMutation.isPending}
          onSubmit={async (values) => {
            setServerError(null)
            try {
              const t = await createMutation.mutateAsync({
                title: values.title.trim(),
                description: values.description?.trim() ? values.description.trim() : undefined,
                avatarUrl: values.avatarUrl.trim() ? values.avatarUrl.trim() : null,
                game: values.game,
                format: values.format,
                formatConfig: formatConfigFromForm(values),
                status: values.status,
              })
              navigate(`/tournaments/${t.id}`, { replace: true })
            } catch (err) {
              setServerError(getRestErrorMessage(err))
            }
          }}
        />
      </div>
    </PageContainer>
  )
}
