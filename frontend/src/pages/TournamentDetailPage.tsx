import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Trophy, Users, WifiOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchTournament } from '@/entities/tournament/api/tournamentApi'
import { RoundRobinPanel } from '@/features/round-robin/ui/RoundRobinPanel'
import { SwissPanel } from '@/features/swiss/ui/SwissPanel'
import { TournamentBracketPanel } from '@/features/tournament-bracket/ui/TournamentBracketPanel'
import {
  CREATABLE_TOURNAMENT_FORMATS,
  type CreatableTournamentFormat,
  type TournamentFormatConfig,
} from '@/entities/tournament/model/types'
import { formatConfigFromForm } from '@/shared/lib/formatConfigPayload'
import { TeamEditModal } from '@/features/team-form/ui/TeamEditModal'
import { TeamForm } from '@/features/team-form/ui/TeamForm'
import { TeamCard } from '@/features/team-list/ui/TeamCard'
import { useCreateTeamMutation, useDeleteTeamMutation } from '@/features/team/api/useTeamMutations'
import { TournamentForm } from '@/features/tournament-form/ui/TournamentForm'
import { TournamentChatsPanel } from '@/features/chat/ui/TournamentChatsPanel'
import { useDeleteTournamentMutation, useUpdateTournamentMutation } from '@/features/tournament/api/useTournamentMutations'
import { CaptainTeamRegistrationPanel } from '@/features/tournament-registration/ui/CaptainTeamRegistrationPanel'
import { useIsAdmin } from '@/shared/hooks/useIsAdmin'
import { useTournamentSocketSync } from '@/shared/hooks/useTournamentSocketSync'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { accountCategoryLabel } from '@/shared/lib/userAccountLabel'
import { transition } from '@/shared/lib/motion'
import { tournamentFormatLabel, tournamentGameLabel, tournamentStatusLabel } from '@/shared/lib/tournamentLabels'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageLoader } from '@/shared/ui/PageLoader'
import { SafeImage } from '@/shared/ui/SafeImage'

export function TournamentDetailPage() {
  const { id: tournamentId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()
  const { presence, lastEvent } = useTournamentSocketSync(tournamentId ?? null)
  const [editing, setEditing] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => fetchTournament(tournamentId as string),
    enabled: Boolean(tournamentId),
  })

  const teams = data?.teams ?? []
  const editingTeam = useMemo(() => {
    if (!editingTeamId) return null
    return teams.find((t) => t.id === editingTeamId) ?? null
  }, [editingTeamId, teams])

  const updateMutation = useUpdateTournamentMutation(tournamentId ?? '')
  const deleteMutation = useDeleteTournamentMutation()
  const createTeamMutation = useCreateTeamMutation(tournamentId ?? '')
  const deleteTeamMutation = useDeleteTeamMutation()

  if (!tournamentId) {
    return <Navigate to="/tournaments" replace />
  }

  if (isPending) {
    return <PageLoader message="Загрузка турнира…" />
  }

  if (isError || !data) {
    return (
      <PageContainer title="Турнир" tagline="Турниры">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState
            icon={WifiOff}
            title="Не удалось загрузить турнир"
            description="Проверьте ссылку или попробуйте обновить страницу."
            action={
              <Button type="button" variant="outline" disabled={isRefetching} onClick={() => void refetch()}>
                {isRefetching ? 'Запрос…' : 'Повторить'}
              </Button>
            }
          />
        </motion.div>
        <div className="mt-6">
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/tournaments">
              <ArrowLeft className="h-4 w-4" />
              К списку турниров
            </Link>
          </Button>
        </div>
      </PageContainer>
    )
  }

  async function handleDelete() {
    if (!tournamentId) return
    if (!window.confirm('Удалить турнир и все связанные команды и матчи?')) return
    setServerError(null)
    try {
      await deleteMutation.mutateAsync(tournamentId)
      navigate('/tournaments', { replace: true })
    } catch (err) {
      setServerError(getRestErrorMessage(err))
    }
  }

  return (
    <PageContainer
      variant="wide"
      title={data.title}
      description={data.description ?? undefined}
      tagline="Турниры"
      titleAside={
        <div
          className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-inner-glow sm:h-24 sm:w-24"
        >
          <SafeImage
            src={data.avatarUrl}
            alt={`${data.title}: аватар`}
            fallback={<Trophy className="m-auto h-9 w-9 text-primary/70 sm:h-11 sm:w-11" aria-hidden />}
            className="h-full w-full"
          />
        </div>
      }
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button asChild variant="neon" className="w-full gap-2 sm:w-auto">
            <Link to={`/tournaments/${tournamentId}/fantasy?focus=roster`}>
              <Sparkles className="h-4 w-4" />
              Фэнтези
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full gap-2 sm:w-auto">
            <Link to={`/tournaments/${tournamentId}/fantasy/leaderboard`}>
              <Trophy className="h-4 w-4" />
              Таблица лидеров
            </Link>
          </Button>
          {isAdmin ? (
            <>
              {editing ? (
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setEditing(false)}>
                  Отменить редактирование
                </Button>
              ) : (
                <Button type="button" className="w-full sm:w-auto" onClick={() => setEditing(true)}>
                  Редактировать
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={deleteMutation.isPending}
                onClick={() => void handleDelete()}
              >
                {deleteMutation.isPending ? 'Удаление…' : 'Удалить'}
              </Button>
            </>
          ) : null}
        </div>
      }
    >
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link to="/tournaments">
            <ArrowLeft className="h-4 w-4" />
            Все турниры
          </Link>
        </Button>
      </div>

      {serverError ? <p className="mb-4 text-sm text-destructive">{serverError}</p> : null}

      <AnimatePresence mode="wait">
        {editing && isAdmin ? (
          <motion.div
            key="tournament-edit"
            layout
            className="glass-panel max-w-full rounded-xl border border-border p-4 shadow-xl sm:max-w-lg sm:p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ ...transition.fast }}
          >
            <TournamentForm
              key={`edit-${data.updatedAt}`}
              formatReadOnlyLabel={
                (CREATABLE_TOURNAMENT_FORMATS as readonly string[]).includes(data.format)
                  ? undefined
                  : tournamentFormatLabel(data.format)
              }
              defaultValues={{
                title: data.title,
                description: data.description ?? '',
                avatarUrl: data.avatarUrl ?? '',
                game: data.game,
                format: (CREATABLE_TOURNAMENT_FORMATS as readonly string[]).includes(data.format)
                  ? (data.format as CreatableTournamentFormat)
                  : 'SINGLE_ELIMINATION',
                swissRounds:
                  (data.formatConfig as TournamentFormatConfig | null | undefined)?.swissRounds?.toString() ??
                  undefined,
                status: data.status,
              }}
              submitLabel="Сохранить изменения"
              isSubmitting={updateMutation.isPending}
              onSubmit={async (values) => {
                setServerError(null)
                const formatEditable = (CREATABLE_TOURNAMENT_FORMATS as readonly string[]).includes(data.format)
                try {
                  await updateMutation.mutateAsync({
                    title: values.title.trim(),
                    description: values.description?.trim() ? values.description.trim() : null,
                    avatarUrl: values.avatarUrl.trim() ? values.avatarUrl.trim() : null,
                    game: values.game,
                    ...(formatEditable
                      ? { format: values.format, formatConfig: formatConfigFromForm(values) }
                      : {}),
                    status: values.status,
                  })
                  setEditing(false)
                } catch (err) {
                  setServerError(getRestErrorMessage(err))
                }
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="tournament-view"
            layout
            className="grid gap-4 sm:gap-6 lg:grid-cols-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ ...transition.base }}
          >
          <Card className="glass-panel border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Информация</CardTitle>
              <CardDescription>Формат, статус и даты</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Игра</p>
                <p className="mt-1 font-medium">{tournamentGameLabel(data.game)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Формат</p>
                <p className="mt-1 font-medium">{tournamentFormatLabel(data.format)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Статус</p>
                <p className="mt-1 font-medium">{tournamentStatusLabel(data.status)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Создан</p>
                <p className="mt-1">{new Date(data.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Обновлён</p>
                <p className="mt-1">{new Date(data.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border">
            <CardHeader>
              <CardTitle className="text-lg">Сводка</CardTitle>
              <CardDescription>Команды и матчи</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Команды</span>
                <span className="font-semibold">{data._count.teams}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Матчи</span>
                <span className="font-semibold">{data._count.matches}</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Создатель</p>
                <p className="mt-1 break-all font-medium">{data.creator.email}</p>
                <p className="text-xs text-muted-foreground">{accountCategoryLabel(data.creator.role)}</p>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8">
        <CaptainTeamRegistrationPanel tournament={data} />
      </div>

      {(data.format === 'SINGLE_ELIMINATION' ||
        data.format === 'ROUND_ROBIN' ||
        data.format === 'SWISS') && (
        <div className="mt-10 space-y-3">
          <div className="mb-2 flex flex-col gap-1 rounded-xl border border-border/90 bg-card/40 px-4 py-3 text-sm text-muted-foreground shadow-inner-glow backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
            <span>
              Онлайн на странице турнира:{' '}
              <span className="font-medium text-foreground">{presence?.onlineCount ?? '—'}</span>
            </span>
            {presence && presence.users.length > 0 ? (
              <span className="text-xs">
                С авторизацией: {presence.users.length}
                {presence.users.length <= 3
                  ? ` (${presence.users.map((u) => u.email?.trim() || 'Участник').join(', ')})`
                  : null}
              </span>
            ) : null}
          </div>
          {lastEvent ? (
            <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs font-medium text-foreground/95 shadow-inner-glow backdrop-blur-sm">
              <span className="text-muted-foreground">{new Date(lastEvent.at).toLocaleTimeString()}</span> —{' '}
              {lastEvent.message}
            </p>
          ) : null}
          {data.format === 'SINGLE_ELIMINATION' ? (
            <TournamentBracketPanel
              tournamentId={tournamentId}
              format={data.format}
              isAdmin={isAdmin}
              teams={teams}
            />
          ) : null}
          {data.format === 'ROUND_ROBIN' ? (
            <RoundRobinPanel tournamentId={tournamentId} isAdmin={isAdmin} teams={teams} />
          ) : null}
          {data.format === 'SWISS' ? (
            <SwissPanel
              tournamentId={tournamentId}
              isAdmin={isAdmin}
              teams={teams}
              swissRounds={(data.formatConfig as TournamentFormatConfig | null | undefined)?.swissRounds}
            />
          ) : null}
        </div>
      )}

      <section className="mt-14 border-t border-border/90 pt-12">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground drop-shadow-[0_0_20px_hsl(var(--primary)/0.12)]">
            Чат
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Общий чат и чат турнира: сообщения появляются сразу, без обновления страницы.
          </p>
        </div>
        <TournamentChatsPanel tournamentId={tournamentId} className="mb-12" />
      </section>

      <section className="mt-14 border-t border-border/90 pt-12">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground drop-shadow-[0_0_20px_hsl(var(--primary)/0.12)]">
              Команды
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Команды, заявленные на этот турнир.{' '}
              <Link to="/teams" className="text-primary underline-offset-4 hover:underline">
                Все команды
              </Link>
            </p>
          </div>
          {isRefetching ? (
            <span className="text-xs text-muted-foreground">Обновление списка…</span>
          ) : null}
        </div>

        {isAdmin && !editing ? (
          <Card className="glass-panel mb-8 max-w-lg">
            <CardHeader>
              <CardTitle className="text-base">Добавить команду</CardTitle>
              <CardDescription>Название и ссылка на логотип</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamForm
                idPrefix={`td-${tournamentId}`}
                defaultValues={{ name: '', logo: '' }}
                submitLabel="Добавить"
                isSubmitting={createTeamMutation.isPending}
                onSubmit={async (payload) => {
                  setServerError(null)
                  try {
                    await createTeamMutation.mutateAsync(payload)
                  } catch (err) {
                    setServerError(getRestErrorMessage(err))
                  }
                }}
              />
            </CardContent>
          </Card>
        ) : null}

        {isAdmin && !editing ? (
          <TeamEditModal
            team={editingTeam}
            open={editingTeamId !== null}
            onOpenChange={(open) => {
              if (!open) setEditingTeamId(null)
            }}
            onError={(msg) => setServerError(msg)}
          />
        ) : null}

        {teams.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={Users}
            title="Команд пока нет"
            description={
              isAdmin
                ? 'Добавьте первую команду формой выше.'
                : 'Список появится, когда администратор добавит участников.'
            }
          />
        ) : (
          <motion.ul layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" transition={transition.layout}>
            {teams.map((team) => (
              <motion.li layout key={team.id} transition={transition.layout}>
                <TeamCard
                  team={team}
                  isAdmin={isAdmin && !editing}
                  onEdit={isAdmin && !editing ? (t) => setEditingTeamId(t.id) : undefined}
                  onDelete={
                    isAdmin && !editing
                      ? (t) => {
                          if (!window.confirm(`Удалить команду «${t.name}»?`)) return
                          setServerError(null)
                          void (async () => {
                            try {
                              await deleteTeamMutation.mutateAsync({
                                tournamentId: tournamentId as string,
                                teamId: t.id,
                              })
                            } catch (err: unknown) {
                              setServerError(getRestErrorMessage(err))
                            }
                          })()
                        }
                      : undefined
                  }
                />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>
    </PageContainer>
  )
}
