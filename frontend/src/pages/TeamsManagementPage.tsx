import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Users, WifiOff } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useIsAdmin } from '@/shared/hooks/useIsAdmin'
import { NativeSelectField } from '@/shared/ui/NativeSelectField'
import { fetchTournaments } from '@/entities/tournament/api/tournamentApi'
import { fetchTeams } from '@/entities/team/api/teamApi'
import type { Team } from '@/entities/team/model/types'
import { TeamEditModal } from '@/features/team-form/ui/TeamEditModal'
import { TeamForm } from '@/features/team-form/ui/TeamForm'
import { TeamCard } from '@/features/team-list/ui/TeamCard'
import { useCreateTeamMutation, useDeleteTeamMutation } from '@/features/team/api/useTeamMutations'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageLoader } from '@/shared/ui/PageLoader'

export function TeamsManagementPage() {
  const isAdmin = useIsAdmin()
  const [filterTournamentId, setFilterTournamentId] = useState<string>('')
  const [createTournamentId, setCreateTournamentId] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const tournamentsQuery = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => fetchTournaments(),
  })

  const teamsQuery = useQuery({
    queryKey: ['teams', filterTournamentId || 'all'],
    queryFn: () => fetchTeams(filterTournamentId ? { tournamentId: filterTournamentId } : undefined),
  })

  const createMutation = useCreateTeamMutation(createTournamentId)
  const deleteMutation = useDeleteTeamMutation()
  const tournamentOptions = useMemo(
    () => (tournamentsQuery.data ?? []).map((t) => ({ id: t.id, title: t.title })),
    [tournamentsQuery.data],
  )

  const editingTeam = useMemo(() => {
    if (!editingTeamId) return null
    return (teamsQuery.data ?? []).find((t) => t.id === editingTeamId) ?? null
  }, [editingTeamId, teamsQuery.data])

  if (tournamentsQuery.isPending || teamsQuery.isPending) {
    return <PageLoader message="Загрузка команд…" />
  }

  if (tournamentsQuery.isError || teamsQuery.isError) {
    return (
      <PageContainer title="Команды" tagline="Управление">
        <EmptyState
          icon={WifiOff}
          title="Не удалось загрузить данные"
          description="Проверьте соединение и попробуйте снова."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void Promise.all([tournamentsQuery.refetch(), teamsQuery.refetch()])}
            >
              Повторить
            </Button>
          }
        />
      </PageContainer>
    )
  }

  async function handleDelete(team: Team) {
    if (!window.confirm(`Удалить команду «${team.name}»?`)) return
    setServerError(null)
    try {
      await deleteMutation.mutateAsync({ tournamentId: team.tournamentId, teamId: team.id })
    } catch (err) {
      setServerError(getRestErrorMessage(err))
    }
  }

  return (
    <PageContainer
      title="Команды"
      description="Создание, логотип по URL и привязка к турниру"
      tagline="Управление"
      actions={
        isAdmin ? (
          <Button type="button" className="gap-2" onClick={() => setCreating((v) => !v)}>
            <Plus className="h-4 w-4" aria-hidden />
            {creating ? 'Скрыть форму' : 'Новая команда'}
          </Button>
        ) : undefined
      }
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <NativeSelectField
          id="team-filter-tournament"
          label="Турнир в списке"
          labelVariant="muted"
          value={filterTournamentId}
          onChange={(e) => setFilterTournamentId(e.target.value)}
        >
          <option value="">Все турниры</option>
          {tournamentOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </NativeSelectField>
      </div>

      {serverError ? <p className="mb-4 text-sm text-destructive">{serverError}</p> : null}

      {creating && isAdmin ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel mb-10 max-w-lg rounded-lg p-6 shadow-md"
        >
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Создать команду</h2>
          <div className="mb-5">
            <NativeSelectField
              id="create-team-tournament"
              label="Турнир"
              value={createTournamentId}
              onChange={(e) => setCreateTournamentId(e.target.value)}
            >
              <option value="">Выберите турнир</option>
              {tournamentOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </NativeSelectField>
          </div>
          <TeamForm
            idPrefix="mgmt-create"
            defaultValues={{ name: '', logo: '' }}
            submitLabel="Создать команду"
            isSubmitting={createMutation.isPending}
            onSubmit={async (payload) => {
              if (!createTournamentId) {
                setServerError('Выберите турнир')
                return
              }
              setServerError(null)
              try {
                await createMutation.mutateAsync(payload)
                setCreating(false)
              } catch (err) {
                setServerError(getRestErrorMessage(err))
              }
            }}
          />
        </motion.div>
      ) : null}

      {isAdmin ? (
        <TeamEditModal
          team={editingTeam}
          open={editingTeamId !== null}
          onOpenChange={(open) => {
            if (!open) setEditingTeamId(null)
          }}
          onError={(msg) => setServerError(msg)}
        />
      ) : null}

      {teamsQuery.data?.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Команд пока нет"
          description="Добавьте участников турнира или смените фильтр."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(teamsQuery.data ?? []).map((team) => (
            <li key={team.id}>
              <TeamCard
                team={team}
                isAdmin={isAdmin}
                onEdit={isAdmin ? (t) => setEditingTeamId(t.id) : undefined}
                onDelete={isAdmin ? (t) => void handleDelete(t) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}
