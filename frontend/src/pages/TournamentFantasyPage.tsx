import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Award, BarChart3, History, ListOrdered, Save, Sparkles, TrendingUp, Trophy } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useForm, useFormState } from 'react-hook-form'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { fetchTournament } from '@/entities/tournament/api/tournamentApi'
import {
  type TournamentFantasyFormValues,
  tournamentFantasyFormSchema,
} from '@/features/fantasy-form/model/tournamentFantasyFormSchema'
import { FantasyMatchPredictionCard } from '@/features/fantasy-predictions/ui/FantasyMatchPredictionCard'
import { FantasySelectionOrderList } from '@/features/fantasy-sortable-selections/ui/FantasySelectionOrderList'
import { fantasyService } from '@/shared/api/services/fantasyService'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { FANTASY_MAX_TEAM_PICKS } from '@/shared/lib/fantasyLimits'
import {
  fantasyRosterEditableHint,
  fantasyRosterLockedMessage,
  fantasyPredictionTypesLine,
  fantasyPredictionTypeLabel,
  FANTASY_POINTS_SHORT,
  mvpBadgeTierLabel,
} from '@/shared/lib/humanLabels'
import { isFantasyRosterEditable } from '@/shared/lib/pickFantasyTournament'
import { useTournamentSocketSync } from '@/shared/hooks/useTournamentSocketSync'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageLoader } from '@/shared/ui/PageLoader'
import { SafeImage } from '@/shared/ui/SafeImage'
import { toast } from 'sonner'

export function TournamentFantasyPage() {
  const { id: tournamentId } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const rosterAnchorRef = useRef<HTMLDivElement | null>(null)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useTournamentSocketSync(tournamentId ?? null)

  const form = useForm<TournamentFantasyFormValues>({
    resolver: zodResolver(tournamentFantasyFormSchema),
    defaultValues: { teamIds: [] },
  })
  const { isDirty: rosterIsDirty } = useFormState({ control: form.control })

  const tournamentQuery = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => fetchTournament(tournamentId as string),
    enabled: Boolean(tournamentId),
  })

  const meQuery = useQuery({
    queryKey: ['fantasy-me', tournamentId],
    queryFn: () => fantasyService.getTournamentFantasyMe(tournamentId as string),
    enabled: Boolean(tournamentId && user),
  })

  const statsQuery = useQuery({
    queryKey: ['fantasy-stats', tournamentId],
    queryFn: () => fantasyService.getTournamentFantasyStats(tournamentId as string),
    enabled: Boolean(tournamentId),
  })

  const boardQuery = useQuery({
    queryKey: ['fantasy-board', tournamentId],
    queryFn: () => fantasyService.getPredictionBoard(tournamentId as string),
    enabled: Boolean(tournamentId),
  })

  const predStatsQuery = useQuery({
    queryKey: ['fantasy-prediction-stats', tournamentId],
    queryFn: () => fantasyService.getPredictionStats(tournamentId as string),
    enabled: Boolean(tournamentId && user),
  })

  const predHistQuery = useQuery({
    queryKey: ['fantasy-prediction-history', tournamentId],
    queryFn: () => fantasyService.getPredictionHistory(tournamentId as string),
    enabled: Boolean(tournamentId && user),
  })

  /** Содержимое ответа, а не ссылка на объект — иначе каждый refetch сбрасывает форму и гасит isDirty (кнопка «Сохранить» остаётся disabled). */
  const fantasyMeBaselineKey = useMemo(() => {
    const ft = meQuery.data
    if (!ft) return ''
    return JSON.stringify({
      teamIds: ft.selections.map((s) => s.team.id),
    })
  }, [meQuery.data])

  useEffect(() => {
    if (!user) {
      form.reset({ teamIds: [] })
      return
    }
    if (meQuery.isPending) return
    const ft = meQuery.data
    form.reset({
      teamIds: ft?.selections.map((s) => s.team.id) ?? [],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- meQuery.data намеренно не в deps: сброс только при смене fantasyMeBaselineKey (иначе каждый refetch гасит isDirty)
  }, [user, meQuery.isPending, fantasyMeBaselineKey, form])

  useEffect(() => {
    if (searchParams.get('focus') !== 'roster') return
    if (tournamentQuery.isPending || !tournamentQuery.data) return
    const rafId = window.requestAnimationFrame(() => {
      rosterAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const next = new URLSearchParams(searchParams)
      next.delete('focus')
      setSearchParams(next, { replace: true })
    })
    return () => window.cancelAnimationFrame(rafId)
  }, [searchParams, setSearchParams, tournamentQuery.isPending, tournamentQuery.data])

  const saveMutation = useMutation({
    mutationFn: (values: TournamentFantasyFormValues) =>
      fantasyService.putTournamentFantasyTeam(tournamentId as string, {
        name: null,
        teamIds: values.teamIds,
      }),
    onSuccess: (fantasyTeam) => {
      form.clearErrors('root')
      if (fantasyTeam) {
        form.reset({
          teamIds: fantasyTeam.selections.map((s) => s.team.id),
        })
        const n = fantasyTeam.selections.length
        const teamWord =
          n % 10 === 1 && n % 100 !== 11 ? 'команда' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'команды' : 'команд'
        toast.success('Состав сохранён', {
          description: `Вы выбрали ${n} ${teamWord} для фэнтези по этому турниру.`,
        })
      }
      void queryClient.invalidateQueries({ queryKey: ['fantasy-me', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-leaderboard', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-board', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-stats', tournamentId] })
      void queryClient.invalidateQueries({ queryKey: ['fantasy-prediction-history', tournamentId] })
    },
    onError: (e) => {
      form.setError('root', { message: getRestErrorMessage(e) })
    },
  })

  const teamIds = form.watch('teamIds')

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const team of tournamentQuery.data?.teams ?? []) {
      map.set(team.id, team.name)
    }
    return map
  }, [tournamentQuery.data?.teams])

  if (!tournamentId) return <Navigate to="/tournaments" replace />

  if (tournamentQuery.isPending) return <PageLoader message="Загрузка фэнтези…" />

  if (tournamentQuery.isError || !tournamentQuery.data) {
    return (
      <PageContainer title="Фэнтези-лига" tagline="Ошибка">
        <p className="text-sm text-destructive">Не удалось загрузить турнир.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/tournaments">К турнирам</Link>
        </Button>
      </PageContainer>
    )
  }

  const t = tournamentQuery.data
  const teamsList = t.teams ?? []
  const rosterEditable = isFantasyRosterEditable(t.status)

  return (
    <PageContainer
      variant="wide"
      title={`Фэнтези · ${t.title}`}
      description="Соберите состав из команд турнира, делайте прогнозы по матчам и следите за таблицей — очки обновляются по ходу игры."
      tagline="Фэнтези-лига"
      titleAside={
        <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-inner-glow sm:h-20 sm:w-20">
          <SafeImage
            src={t.avatarUrl}
            alt={`${t.title}: аватар`}
            fallback={<Trophy className="m-auto h-8 w-8 text-primary/70 sm:h-9 sm:w-9" aria-hidden />}
            className="h-full w-full"
          />
        </div>
      }
      actions={
        <Button asChild variant="neon" className="w-full gap-2 sm:w-auto">
          <Link to={`/tournaments/${tournamentId}/fantasy/leaderboard`}>
            <ListOrdered className="h-4 w-4" />
            Таблица лидеров
          </Link>
        </Button>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link to={`/tournaments/${tournamentId}`}>
            <ArrowLeft className="h-4 w-4" />
            К турниру
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link to="/tournaments/fantasy/pick">Выбрать другой турнир</Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
        <motion.div ref={rosterAnchorRef} id="fantasy-roster" className="scroll-mt-28" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-panel border-primary/15">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-glow-sm">
                  <Sparkles className="h-5 w-5" />
                </span>
                <CardTitle className="text-xl font-extrabold tracking-tight">Мой состав</CardTitle>
              </div>
              <CardDescription>{fantasyRosterEditableHint()}</CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <p className="text-sm text-muted-foreground">
                  <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                    Войдите
                  </Link>
                  , чтобы собрать состав.
                </p>
              ) : meQuery.isPending ? (
                <p className="text-sm text-muted-foreground">Загрузка вашей команды…</p>
              ) : meQuery.isError ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive">{getRestErrorMessage(meQuery.error, 'Не удалось загрузить состав')}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => void meQuery.refetch()}>
                    Повторить
                  </Button>
                </div>
              ) : (
                <form
                  className="space-y-6"
                  onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
                  noValidate
                >
                  {meQuery.data ? (
                    <div className="flex flex-wrap gap-6 rounded-xl border border-primary/25 bg-card/60 px-5 py-4 text-sm shadow-glow-sm backdrop-blur-sm">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Место</p>
                        <p className="mt-1 font-mono text-3xl font-extrabold tabular-nums text-foreground drop-shadow-[0_0_16px_hsl(var(--primary)/0.25)]">
                          #{meQuery.data.rank}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Всего</p>
                        <p className="mt-1 font-mono text-3xl font-extrabold tabular-nums text-foreground">{meQuery.data.points}</p>
                      </div>
                      <div className="min-w-[8rem] border-l border-border/90 pl-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Разбивка</p>
                        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          <li>Состав: {meQuery.data.rosterPoints}</li>
                          <li>Прогнозы: {meQuery.data.fantasyPredictionPoints}</li>
                          <li>Бонусы: {meQuery.data.fantasyBonusPoints}</li>
                        </ul>
                      </div>
                      {meQuery.data.mvpBadgeTier ? (
                        <div className="flex items-center gap-2 border-l border-border/90 pl-6">
                          <Award
                            className={`h-8 w-8 shrink-0 ${
                              meQuery.data.mvpBadgeTier === 'gold'
                                ? 'text-amber-700'
                                : meQuery.data.mvpBadgeTier === 'silver'
                                  ? 'text-slate-500'
                                  : 'text-amber-800'
                            }`}
                            aria-hidden
                          />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Лучший игрок</p>
                            <p className="text-sm font-semibold">{mvpBadgeTierLabel(meQuery.data.mvpBadgeTier)}</p>
                            <p className="text-[11px] text-muted-foreground">Верно: {meQuery.data.mvpCorrectCount}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Состав ещё не создан — выберите команды ниже.</p>
                  )}

                  {!rosterEditable ? (
                    <p className="rounded-lg border border-amber-400/45 bg-amber-500/20 px-3 py-2.5 text-sm font-medium leading-relaxed text-amber-50">
                      {fantasyRosterLockedMessage(t.status)}
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Команды турнира{' '}
                      <span className="text-muted-foreground">
                        ({teamIds.length}/{FANTASY_MAX_TEAM_PICKS})
                      </span>
                    </p>
                    <FantasySelectionOrderList
                      teamIds={teamIds}
                      getTeamName={(id) => teamNameById.get(id) ?? 'Команда'}
                      disabled={!rosterEditable || saveMutation.isPending}
                      onReorder={(next) => {
                        form.clearErrors('root')
                        form.setValue('teamIds', next, { shouldValidate: true, shouldDirty: true })
                      }}
                    />
                    <ul className="grid max-h-[min(24rem,55svh)] gap-2.5 overflow-y-auto overscroll-y-contain pr-1 sm:max-h-[20rem] sm:grid-cols-2 md:max-h-[22rem]">
                      {teamsList.map((team) => {
                        const on = teamIds.includes(team.id)
                        return (
                          <li key={team.id}>
                            <button
                              type="button"
                              disabled={!rosterEditable || (!on && teamIds.length >= FANTASY_MAX_TEAM_PICKS)}
                              onClick={() => {
                                form.clearErrors('root')
                                const ids = form.getValues('teamIds')
                                const i = ids.indexOf(team.id)
                                if (i >= 0) {
                                  form.setValue(
                                    'teamIds',
                                    ids.filter((id) => id !== team.id),
                                    { shouldValidate: true, shouldDirty: true },
                                  )
                                } else if (ids.length < FANTASY_MAX_TEAM_PICKS) {
                                  form.setValue('teamIds', [...ids, team.id], { shouldValidate: true, shouldDirty: true })
                                }
                              }}
                              className={`group/pick flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-all duration-200 ${
                                on
                                  ? 'border-primary/45 bg-primary/12 text-foreground shadow-glow-sm'
                                  : 'border-border/90 bg-muted/35 text-muted-foreground hover:border-primary/25 hover:bg-primary/8 hover:text-foreground'
                              } disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-200 ${
                                  on
                                    ? 'border-primary/50 bg-primary/25 text-primary-foreground shadow-inner-glow'
                                    : 'border-border/90 bg-muted/30 text-transparent group-hover/pick:border-primary/30'
                                }`}
                              >
                                {on ? '✓' : ''}
                              </span>
                              <span className="min-w-0 truncate">{team.name}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    {form.formState.errors.teamIds ? (
                      <p className="text-xs text-destructive">{form.formState.errors.teamIds.message}</p>
                    ) : null}
                  </div>

                  {form.formState.errors.root ? (
                    <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                  ) : null}

                  <Button
                    type="submit"
                    className="gap-2 shadow-glow-sm"
                    disabled={!rosterEditable || saveMutation.isPending || !rosterIsDirty}
                  >
                    <Save className="h-4 w-4" />
                    {saveMutation.isPending ? 'Сохранение…' : 'Сохранить состав'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card className="glass-panel border-primary/15">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/35 bg-primary/12 text-primary shadow-[0_0_20px_-6px_hsl(var(--primary)/0.4)]">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <CardTitle className="text-xl font-extrabold tracking-tight">Статистика команд</CardTitle>
              </div>
              <CardDescription>Победы в завершённых матчах и очки за каждую победу выбранной команды.</CardDescription>
            </CardHeader>
            <CardContent>
              {statsQuery.isPending ? (
                <p className="text-sm text-muted-foreground">Загрузка…</p>
              ) : statsQuery.isError ? (
                <p className="text-sm text-destructive">Не удалось загрузить статистику.</p>
              ) : (
                <ul className="space-y-3.5">
                  {(statsQuery.data ?? []).map((row, i) => {
                    const maxW = Math.max(...(statsQuery.data ?? []).map((x) => x.wins), 1)
                    const pct = (row.wins / maxW) * 100
                    return (
                      <li
                        key={row.id}
                        className="group/stat overflow-hidden rounded-xl border border-border/90 bg-muted/35 px-4 py-3 shadow-inner-glow backdrop-blur-sm transition-all duration-200 hover:border-primary/25"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-semibold tracking-tight">
                            <span className="font-mono text-xs font-bold text-primary tabular-nums">{i + 1}. </span>
                            {row.name}
                          </span>
                          <span className="shrink-0 tabular-nums font-semibold text-foreground">{row.wins} побед</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.55, ease: 'easeOut' }}
                          />
                        </div>
                        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                          {row.pointsFromWins} {FANTASY_POINTS_SHORT} за победы
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mt-10 space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Прогнозы по матчам</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Категории прогнозов задаёт организатор турнира. Очки начисляются автоматически после
              публикации результата матча.
            </p>
            {user && !meQuery.isPending && !meQuery.data ? (
              <p className="mt-2 rounded-lg border border-amber-400/45 bg-amber-500/20 px-3 py-2 text-sm font-medium leading-relaxed text-amber-50">
                Сначала сохраните состав выше — без этого прогнозы по матчам недоступны.
              </p>
            ) : null}
            {boardQuery.data?.activePredictionTypes?.length ? (
              <p className="mt-2 text-xs font-medium text-primary">
                Условия: {fantasyPredictionTypesLine(boardQuery.data.activePredictionTypes)}
              </p>
            ) : null}
          </div>
        </div>

        {boardQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Загрузка матчей…</p>
        ) : boardQuery.isError ? (
          <p className="text-sm text-destructive">Не удалось загрузить доску прогнозов.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(boardQuery.data?.matches ?? []).map((m) => (
              <FantasyMatchPredictionCard
                key={m.id}
                tournamentId={tournamentId}
                match={m}
                activeTypes={boardQuery.data?.activePredictionTypes ?? []}
                disabled={!user || !meQuery.data}
              />
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-panel border-border/90">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Статистика прогнозов</CardTitle>
              </div>
              <CardDescription>Верные попадания и очки по типам (по завершённым матчам).</CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <p className="text-sm text-muted-foreground">Войдите, чтобы видеть свою статистику.</p>
              ) : predStatsQuery.isPending ? (
                <p className="text-sm text-muted-foreground">Загрузка…</p>
              ) : predStatsQuery.isError ? (
                <p className="text-sm text-destructive">Ошибка загрузки.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="rounded-md border border-border px-2 py-1 tabular-nums">
                      Прогнозов (заверш.): {predStatsQuery.data.totalPredictionRows}
                    </span>
                    <span className="rounded-md border border-border px-2 py-1 tabular-nums">
                      Очки: {predStatsQuery.data.totalPointsFromPredictions}
                    </span>
                    <span className="rounded-md border border-border px-2 py-1 tabular-nums">
                      Бонусы: {predStatsQuery.data.totalBonus}
                    </span>
                    <span className="rounded-md border border-border px-2 py-1 tabular-nums">
                      Верно «лучший игрок»: {predStatsQuery.data.mvpCorrect}
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {Object.entries(predStatsQuery.data.byKind).map(([kind, row]) => (
                      <li key={kind} className="flex justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                        <span className="font-medium">{fantasyPredictionTypeLabel(kind)}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {row.correct}/{row.total} · {row.points} {FANTASY_POINTS_SHORT}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/90">
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">История прогнозов</CardTitle>
              </div>
              <CardDescription>Последние сохранённые прогнозы и начисленные очки.</CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <p className="text-sm text-muted-foreground">Войдите, чтобы видеть историю.</p>
              ) : predHistQuery.isPending ? (
                <p className="text-sm text-muted-foreground">Загрузка…</p>
              ) : predHistQuery.isError ? (
                <p className="text-sm text-destructive">Ошибка загрузки.</p>
              ) : predHistQuery.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">Пока нет сохранённых прогнозов.</p>
              ) : (
                <ul className="max-h-80 space-y-2 overflow-y-auto pr-1 text-sm">
                  {predHistQuery.data.map((e) => {
                    const pts =
                      e.ptsWinner +
                      e.ptsMvp +
                      e.ptsFirstKill +
                      e.ptsHighestScore +
                      e.ptsExactScore +
                      e.bonusPts
                    return (
                      <li key={e.id} className="rounded-md border border-border/60 bg-muted/15 px-3 py-2">
                        <div className="flex justify-between gap-2 font-medium">
                          <span>
                            R{e.match.round} M{e.match.position}: {e.match.teamA.name} vs {e.match.teamB.name}
                          </span>
                          <span className="shrink-0 tabular-nums text-primary">+{pts}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Счёт {e.match.scoreA ?? '—'}:{e.match.scoreB ?? '—'}
                          {e.match.winnerId ? '' : ' · матч не завершён'}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </PageContainer>
  )
}
