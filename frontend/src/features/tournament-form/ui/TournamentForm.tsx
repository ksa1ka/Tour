import { zodResolver } from '@hookform/resolvers/zod'

import { Trophy } from 'lucide-react'

import { useForm } from 'react-hook-form'



import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'

import { CREATABLE_TOURNAMENT_FORMATS } from '@/entities/tournament/model/types'

import { cn } from '@/shared/lib/utils'

import { tournamentFormatLabel, tournamentStatusLabel, tournamentGameLabel } from '@/shared/lib/tournamentLabels'

import { nativeSelectClassName } from '@/shared/ui/NativeSelectField'
import { SafeImage } from '@/shared/ui/SafeImage'



import { TOURNAMENT_GAMES } from '@/entities/tournament/model/types'



import { type TournamentFormValues, tournamentFormSchema } from '../model/tournamentFormSchema'



const statusOptions: TournamentFormValues['status'][] = [

  'DRAFT',

  'OPEN',

  'REGISTRATION',

  'CLOSED',

  'IN_PROGRESS',

  'COMPLETED',

  'CANCELLED',

]



const gameOptions: TournamentFormValues['game'][] = [...TOURNAMENT_GAMES]



const formatOptions = [...CREATABLE_TOURNAMENT_FORMATS]



type TournamentFormProps = {

  defaultValues: TournamentFormValues

  onSubmit: (values: TournamentFormValues) => Promise<void>

  isSubmitting: boolean

  submitLabel: string

  /** Текущий формат турнира только для отображения (legacy / нередактируемый). */
  formatReadOnlyLabel?: string

}



export function TournamentForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  formatReadOnlyLabel,
}: TournamentFormProps) {

  const form = useForm<TournamentFormValues>({

    resolver: zodResolver(tournamentFormSchema),

    defaultValues,

  })



  const format = form.watch('format')



  return (

    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>

      <div className="space-y-2">

        <Label htmlFor="tournament-title">Название</Label>

        <Input id="tournament-title" autoComplete="off" {...form.register('title')} />

        {form.formState.errors.title && (

          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>

        )}

      </div>



      <div className="space-y-2">

        <Label htmlFor="tournament-description">Описание</Label>

        <textarea

          id="tournament-description"

          rows={4}

          className={cn(

            'min-h-[120px] w-full resize-y rounded-md border border-input bg-transparent px-4 py-3 text-base shadow-sm transition-colors placeholder:text-muted-foreground',

            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',

          )}

          placeholder="Необязательно"

          {...form.register('description')}

        />

        {form.formState.errors.description && (

          <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>

        )}

      </div>



      <div className="space-y-2">

        <Label htmlFor="tournament-avatarUrl">Ссылка на обложку турнира</Label>

        <Input id="tournament-avatarUrl" autoComplete="off" placeholder="https://…" {...form.register('avatarUrl')} />

        {form.formState.errors.avatarUrl && (

          <p className="text-xs text-destructive">{form.formState.errors.avatarUrl.message}</p>

        )}

        <div className="flex items-center gap-3 pt-1">

          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/90 bg-muted/35 shadow-inner-glow">

            <SafeImage

              src={form.watch('avatarUrl')}

              alt=""

              fallback={<Trophy className="m-auto h-7 w-7 text-primary/70" aria-hidden />}

              className="h-full w-full"

            />

          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">

            Показывается в списке турниров и в шапке страницы. Пустое поле — без картинки.

          </p>

        </div>

      </div>



      <div className="space-y-2">

        <Label htmlFor="tournament-game">Игра</Label>

        <select id="tournament-game" className={nativeSelectClassName} {...form.register('game')}>

          {gameOptions.map((g) => (

            <option key={g} value={g}>

              {tournamentGameLabel(g)}

            </option>

          ))}

        </select>

        {form.formState.errors.game && (

          <p className="text-xs text-destructive">{form.formState.errors.game.message}</p>

        )}

      </div>



      <div className="space-y-2">

        <Label htmlFor="tournament-format">Формат</Label>

        {formatReadOnlyLabel ? (
          <p
            id="tournament-format"
            className="rounded-md border border-input bg-muted/25 px-4 py-2.5 text-sm text-muted-foreground"
          >
            {formatReadOnlyLabel} (нельзя изменить для этого турнира)
          </p>
        ) : (
          <select id="tournament-format" className={nativeSelectClassName} {...form.register('format')}>

            {formatOptions.map((f) => (

              <option key={f} value={f}>

                {tournamentFormatLabel(f)}

              </option>

            ))}

          </select>
        )}

        {format === 'ROUND_ROBIN' ? (

          <p className="text-xs text-muted-foreground">

            Каждая команда играет с каждой. Рекомендуется 3–12 команд (при 8 — 28 матчей).

          </p>

        ) : null}

        {format === 'SWISS' ? (

          <p className="text-xs text-muted-foreground">

            Ограниченное число туров, пары по результату. Минимум 4 команды.

          </p>

        ) : null}

        {form.formState.errors.format && (

          <p className="text-xs text-destructive">{form.formState.errors.format.message}</p>

        )}

      </div>



      {format === 'SWISS' ? (

        <div className="space-y-2">

          <Label htmlFor="tournament-swissRounds">Число туров (необязательно)</Label>

          <Input

            id="tournament-swissRounds"

            type="number"

            min={3}

            max={12}

            placeholder="Авто: ceil(log₂ N)"

            {...form.register('swissRounds')}

          />

          <p className="text-xs text-muted-foreground">Оставьте пустым для автоматического расчёта (обычно 5–7).</p>

          {form.formState.errors.swissRounds && (

            <p className="text-xs text-destructive">{String(form.formState.errors.swissRounds.message)}</p>

          )}

        </div>

      ) : null}



      <div className="space-y-2">

        <Label htmlFor="tournament-status">Статус</Label>

        <select id="tournament-status" className={nativeSelectClassName} {...form.register('status')}>

          {statusOptions.map((s) => (

            <option key={s} value={s}>

              {tournamentStatusLabel(s)}

            </option>

          ))}

        </select>

        {form.formState.errors.status && (

          <p className="text-xs text-destructive">{form.formState.errors.status.message}</p>

        )}

      </div>



      {form.formState.errors.root && (

        <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>

      )}



      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>

        {isSubmitting ? 'Сохранение…' : submitLabel}

      </Button>

    </form>

  )

}


