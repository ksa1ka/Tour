import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FantasyBoardMatchDto, FantasyPredictionType } from '@/shared/api/services/fantasyService'
import { fantasyService } from '@/shared/api/services/fantasyService'
import { getRestErrorMessage } from '@/shared/lib/restErrors'

function buildSchema(active: FantasyPredictionType[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  if (active.includes('WINNER')) shape.predictedWinnerTeamId = z.string().min(1, 'Выберите победителя')
  if (active.includes('MVP')) shape.predictedMvpPlayerId = z.string().min(1, 'Выберите лучшего игрока')
  if (active.includes('FIRST_KILL')) shape.predictedFirstKillPlayerId = z.string().min(1, 'Выберите игрока с первым фрагом')
  if (active.includes('HIGHEST_SCORE')) shape.predictedHighestScoreTeamId = z.string().min(1, 'Выберите команду')
  if (active.includes('EXACT_SCORE')) {
    shape.predictedScoreA = z.coerce.number().int().min(0).max(999)
    shape.predictedScoreB = z.coerce.number().int().min(0).max(999)
  }
  let schema = z.object(shape)
  if (active.includes('EXACT_SCORE')) {
    schema = schema.superRefine((data, ctx) => {
      const a = data.predictedScoreA as number
      const b = data.predictedScoreB as number
      if (a === b) {
        ctx.addIssue({ code: 'custom', message: 'Ничья в счёте недопустима', path: ['predictedScoreB'] })
      }
    }) as typeof schema
  }
  return schema
}

type FormValues = Record<string, string | number | undefined>

type Props = {
  tournamentId: string
  match: FantasyBoardMatchDto
  activeTypes: FantasyPredictionType[]
  disabled?: boolean
}

export function FantasyMatchPredictionCard({ tournamentId, match, activeTypes, disabled }: Props) {
  const qc = useQueryClient()
  const schema = useMemo(() => buildSchema(activeTypes), [activeTypes])

  /** Иначе каждый refetch доски даёт новую ссылку на myPrediction → useMemo/useEffect сбрасывают форму и гасят isDirty. */
  const myPredictionContentKey = JSON.stringify(match.myPrediction ?? null)
  const activeTypesContentKey = [...activeTypes].sort().join('|')

  const defaultValues = useMemo((): FormValues => {
    const p = match.myPrediction
    const v: FormValues = {}
    if (activeTypes.includes('WINNER')) v.predictedWinnerTeamId = p?.predictedWinnerTeamId ?? ''
    if (activeTypes.includes('MVP')) v.predictedMvpPlayerId = p?.predictedMvpPlayerId ?? ''
    if (activeTypes.includes('FIRST_KILL')) v.predictedFirstKillPlayerId = p?.predictedFirstKillPlayerId ?? ''
    if (activeTypes.includes('HIGHEST_SCORE')) v.predictedHighestScoreTeamId = p?.predictedHighestScoreTeamId ?? ''
    if (activeTypes.includes('EXACT_SCORE')) {
      v.predictedScoreA = p?.predictedScoreA ?? ''
      v.predictedScoreB = p?.predictedScoreB ?? ''
    }
    return v
    // eslint-disable-next-line react-hooks/exhaustive-deps -- match/activeTypes читаются при смене *ContentKey; иначе refetch сбрасывает черновик
  }, [myPredictionContentKey, activeTypesContentKey])

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      fantasyService.putMatchPrediction(tournamentId, match.id, {
        predictedWinnerTeamId: (values.predictedWinnerTeamId as string) || null,
        predictedMvpPlayerId: (values.predictedMvpPlayerId as string) || null,
        predictedFirstKillPlayerId: (values.predictedFirstKillPlayerId as string) || null,
        predictedHighestScoreTeamId: (values.predictedHighestScoreTeamId as string) || null,
        predictedScoreA:
          values.predictedScoreA === '' || values.predictedScoreA === undefined
            ? null
            : Number(values.predictedScoreA),
        predictedScoreB:
          values.predictedScoreB === '' || values.predictedScoreB === undefined
            ? null
            : Number(values.predictedScoreB),
      }),
    onSuccess: () => {
      clearErrors('root')
      void qc.invalidateQueries({ queryKey: ['fantasy-board', tournamentId] })
      void qc.invalidateQueries({ queryKey: ['fantasy-me', tournamentId] })
      void qc.invalidateQueries({ queryKey: ['fantasy-prediction-stats', tournamentId] })
      void qc.invalidateQueries({ queryKey: ['fantasy-prediction-history', tournamentId] })
      void qc.invalidateQueries({ queryKey: ['fantasy-leaderboard', tournamentId] })
    },
    onError: (e) => {
      setError('root', { message: getRestErrorMessage(e) })
    },
  })

  const players = useMemo(() => {
    const a = match.teamA?.players ?? []
    const b = match.teamB?.players ?? []
    return [...a, ...b]
  }, [match.teamA?.players, match.teamB?.players])

  const teamAName = match.teamA?.name ?? 'Команда A'
  const teamBName = match.teamB?.name ?? 'Команда B'

  const locked = !match.predictable
  const pts = match.myPrediction
  const earned =
    (pts?.ptsWinner ?? 0) +
    (pts?.ptsMvp ?? 0) +
    (pts?.ptsFirstKill ?? 0) +
    (pts?.ptsHighestScore ?? 0) +
    (pts?.ptsExactScore ?? 0) +
    (pts?.bonusPts ?? 0)

  return (
    <Card className={locked ? 'opacity-90' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Раунд {match.round} · матч {match.position}
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-x-3 gap-y-1">
          <span>
            {teamAName} vs {teamBName}
          </span>
          {locked ? (
            <span className="text-muted-foreground">
              {match.winnerId || (match.scoreA != null && match.scoreB != null) ? 'Завершён' : 'Ожидание команд'}
              {earned > 0 ? ` · +${earned} очков` : ''}
            </span>
          ) : (
            <span className="text-muted-foreground">Прогноз открыт до начала результата</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {locked ? (
          <div className="text-sm text-muted-foreground">
            Итог: {match.scoreA ?? '—'} : {match.scoreB ?? '—'}
            {match.winnerId ? null : (
              <span className="ml-2">Прогнозы закрыты — матч завершён.</span>
            )}
            {earned > 0 ? (
              <span className="ml-2 text-foreground">
                Набрано {earned} оч. (в т.ч. бонус {pts?.bonusPts ?? 0})
              </span>
            ) : match.winnerId ? (
              <span className="ml-2">Очки начислятся при полном вводе результата матча администратором.</span>
            ) : null}
          </div>
        ) : !match.teamAId || !match.teamBId ? (
          <p className="text-sm text-muted-foreground">Слоты команд ещё не заполнены.</p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            noValidate
          >
            {activeTypes.includes('WINNER') ? (
              <div className="space-y-2">
                <Label>Победитель матча</Label>
                <div className="flex flex-wrap gap-2">
                  {[match.teamA, match.teamB].map((t) =>
                    t ? (
                      <label
                        key={t.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary/60 has-[:checked]:bg-primary/10"
                      >
                        <input type="radio" value={t.id} {...register('predictedWinnerTeamId')} />
                        {t.name}
                      </label>
                    ) : null,
                  )}
                </div>
                {errors.predictedWinnerTeamId ? (
                  <p className="text-xs text-destructive">
                    {String(errors.predictedWinnerTeamId.message)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {activeTypes.includes('MVP') ? (
              <div className="space-y-2">
                <Label>Лучший игрок</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register('predictedMvpPlayerId')}
                >
                  <option value="">— игрок —</option>
                  {players.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.nickname} ({pl.role})
                    </option>
                  ))}
                </select>
                {errors.predictedMvpPlayerId ? (
                  <p className="text-xs text-destructive">
                    {String(errors.predictedMvpPlayerId.message)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {activeTypes.includes('FIRST_KILL') ? (
              <div className="space-y-2">
                <Label>Первый фраг</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register('predictedFirstKillPlayerId')}
                >
                  <option value="">— игрок —</option>
                  {players.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.nickname}
                    </option>
                  ))}
                </select>
                {errors.predictedFirstKillPlayerId ? (
                  <p className="text-xs text-destructive">
                    {String(errors.predictedFirstKillPlayerId.message)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {activeTypes.includes('HIGHEST_SCORE') ? (
              <div className="space-y-2">
                <Label>Наибольший счёт (команда)</Label>
                <div className="flex flex-wrap gap-2">
                  {[match.teamA, match.teamB].map((t) =>
                    t ? (
                      <label
                        key={t.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary/60 has-[:checked]:bg-primary/10"
                      >
                        <input type="radio" value={t.id} {...register('predictedHighestScoreTeamId')} />
                        {t.name}
                      </label>
                    ) : null,
                  )}
                </div>
                {errors.predictedHighestScoreTeamId ? (
                  <p className="text-xs text-destructive">
                    {String(errors.predictedHighestScoreTeamId.message)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {activeTypes.includes('EXACT_SCORE') ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Счёт {teamAName}</Label>
                  <Input type="number" inputMode="numeric" min={0} max={999} {...register('predictedScoreA')} />
                  {errors.predictedScoreA ? (
                    <p className="text-xs text-destructive">{String(errors.predictedScoreA.message)}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Счёт {teamBName}</Label>
                  <Input type="number" inputMode="numeric" min={0} max={999} {...register('predictedScoreB')} />
                  {errors.predictedScoreB ? (
                    <p className="text-xs text-destructive">{String(errors.predictedScoreB.message)}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {errors.root ? (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            ) : null}

            <Button type="submit" size="sm" className="gap-2" disabled={disabled || mutation.isPending || !isDirty}>
              <Save className="h-4 w-4" />
              {mutation.isPending ? 'Сохранение…' : 'Сохранить прогноз'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
