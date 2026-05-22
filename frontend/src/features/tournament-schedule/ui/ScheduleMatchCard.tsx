import { zodResolver } from '@hookform/resolvers/zod'
import { RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  type MatchScoreFormValues,
  createMatchScoreSetFormSchema,
  matchScoreSetFormSchemaAllowDraw,
  scoresFromMatchScoreForm,
} from '@/features/tournament-bracket/model/matchScoreFormSchema'
import type { BracketMatchDto } from '@/shared/api/services/matchService'

type ScheduleMatchCardProps = {
  match: BracketMatchDto
  allowDraw: boolean
  isAdmin: boolean
  isBusy: boolean
  onSubmitScore: (matchId: string, scoreA: number, scoreB: number) => void
  onClear: (matchId: string) => void
}

function isMatchFinished(m: BracketMatchDto): boolean {
  return m.scoreA != null && m.scoreB != null
}

export function ScheduleMatchCard({
  match,
  allowDraw,
  isAdmin,
  isBusy,
  onSubmitScore,
  onClear,
}: ScheduleMatchCardProps) {
  const schema = allowDraw ? matchScoreSetFormSchemaAllowDraw : createMatchScoreSetFormSchema(false)
  const form = useForm<MatchScoreFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      scoreA: match.scoreA != null ? String(match.scoreA) : '',
      scoreB: match.scoreB != null ? String(match.scoreB) : '',
    },
  })

  useEffect(() => {
    form.reset({
      scoreA: match.scoreA != null ? String(match.scoreA) : '',
      scoreB: match.scoreB != null ? String(match.scoreB) : '',
    })
  }, [match.id, match.scoreA, match.scoreB, form])

  const hasOpponent = Boolean(match.teamAId && match.teamBId)
  const bye = Boolean(match.teamAId && !match.teamBId)
  const finished = isMatchFinished(match)
  const canEdit = isAdmin && hasOpponent && !finished

  const nameA = match.teamA?.name ?? '—'
  const nameB = match.teamB?.name ?? (bye ? 'Bye' : '—')

  return (
    <article className="rounded-xl border border-border/90 bg-card/95 p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Тур {match.round} · матч #{match.position}
        </span>
        {finished && match.scoreA != null && match.scoreB != null ? (
          <span className="font-mono font-bold text-foreground">
            {match.scoreA} : {match.scoreB}
            {match.scoreA === match.scoreB ? ' (ничья)' : ''}
          </span>
        ) : null}
      </div>

      <div className="space-y-1 text-sm font-medium">
        <p className={match.winnerId === match.teamAId ? 'text-primary' : ''}>{nameA}</p>
        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">vs</p>
        <p className={match.winnerId === match.teamBId ? 'text-primary' : ''}>{nameB}</p>
      </div>

      {bye ? (
        <p className="mt-2 text-xs text-muted-foreground">Команда не играет в этом туре (bye).</p>
      ) : null}

      {canEdit ? (
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={form.handleSubmit((vals) => {
            const { scoreA, scoreB } = scoresFromMatchScoreForm(vals)
            onSubmitScore(match.id, scoreA, scoreB)
          })}
        >
          <div>
            <label className="text-[10px] text-muted-foreground">Счёт A</label>
            <input
              className="mt-0.5 w-16 rounded-md border border-input bg-background px-2 py-1 font-mono text-sm"
              {...form.register('scoreA')}
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Счёт B</label>
            <input
              className="mt-0.5 w-16 rounded-md border border-input bg-background px-2 py-1 font-mono text-sm"
              {...form.register('scoreB')}
            />
          </div>
          <Button type="submit" size="sm" disabled={isBusy}>
            Зафиксировать
          </Button>
          {(form.formState.errors.scoreA || form.formState.errors.scoreB) && (
            <p className="w-full text-xs text-destructive">
              {form.formState.errors.scoreA?.message ?? form.formState.errors.scoreB?.message}
            </p>
          )}
        </form>
      ) : null}

      {isAdmin && finished && hasOpponent ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 gap-1 text-muted-foreground"
          disabled={isBusy}
          onClick={() => onClear(match.id)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Сброс
        </Button>
      ) : null}
    </article>
  )
}
