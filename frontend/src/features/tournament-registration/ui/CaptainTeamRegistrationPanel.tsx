import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TournamentDetail, TournamentStatus } from '@/entities/tournament/model/types'
import {
  useRegisterCaptainTeamMutation,
  useUpdateCaptainTeamMutation,
  useWithdrawCaptainTeamMutation,
} from '@/features/tournament-registration/api/useCaptainTeamMutations'
import {
  captainTeamFormSchema,
  captainTeamFormValuesFromTeam,
  captainTeamPayloadFromForm,
  emptyCaptainTeamFormValues,
  rosterPlayerLabel,
  type CaptainTeamFormValues,
} from '@/features/tournament-registration/model/captainTeamFormSchema'
import { useAuth } from '@/context/AuthContext'
import { useIsPlayer } from '@/shared/hooks/useIsPlayer'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { tournamentStatusLabel } from '@/shared/lib/tournamentLabels'

const REGISTERABLE_STATUSES: TournamentStatus[] = ['OPEN', 'REGISTRATION']

type Props = {
  tournament: TournamentDetail
}

export function CaptainTeamRegistrationPanel({ tournament }: Props) {
  const { user } = useAuth()
  const isPlayer = useIsPlayer()
  const registrationOpen = REGISTERABLE_STATUSES.includes(tournament.status)
  const myTeam = tournament.myTeam
  const [editing, setEditing] = useState(false)

  const registerMutation = useRegisterCaptainTeamMutation(tournament.id)
  const updateMutation = useUpdateCaptainTeamMutation(tournament.id)
  const withdrawMutation = useWithdrawCaptainTeamMutation(tournament.id)

  const form = useForm<CaptainTeamFormValues>({
    resolver: zodResolver(captainTeamFormSchema),
    defaultValues: myTeam ? captainTeamFormValuesFromTeam(myTeam) : emptyCaptainTeamFormValues,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'players' })

  useEffect(() => {
    if (editing && myTeam) {
      form.reset(captainTeamFormValuesFromTeam(myTeam))
    }
  }, [editing, myTeam, form])

  const isPending = registerMutation.isPending || updateMutation.isPending || withdrawMutation.isPending
  const error =
    registerMutation.error != null
      ? getRestErrorMessage(registerMutation.error)
      : updateMutation.error != null
        ? getRestErrorMessage(updateMutation.error)
        : withdrawMutation.error != null
          ? getRestErrorMessage(withdrawMutation.error)
          : null

  if (!registrationOpen && !myTeam) {
    return null
  }

  const showForm = isPlayer && registrationOpen && (!myTeam || editing)

  async function onSubmit(values: CaptainTeamFormValues) {
    const payload = captainTeamPayloadFromForm(values)
    if (myTeam) {
      await updateMutation.mutateAsync(payload)
      setEditing(false)
    } else {
      await registerMutation.mutateAsync(payload)
    }
  }

  return (
    <Card className="glass-panel border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" aria-hidden />
          Регистрация команды
        </CardTitle>
        <CardDescription>
          Статус турнира: {tournamentStatusLabel(tournament.status)} · команд в турнире:{' '}
          {tournament._count.teams}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!user ? (
          <p className="text-muted-foreground">
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Войдите
            </Link>{' '}
            или{' '}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              зарегистрируйтесь как игрок
            </Link>
            , чтобы подать заявку командой.
          </p>
        ) : null}

        {user && !isPlayer ? (
          <p className="text-muted-foreground">
            Подать заявку может только капитан с категорией аккаунта «Игрок». Зрители могут следить за турниром и
            играть в фэнтези.
          </p>
        ) : null}

        {user && isPlayer && myTeam && !editing ? (
          <div className="space-y-3">
            <p className="font-medium text-foreground">
              Ваша команда: <span className="text-primary">{myTeam.name}</span>
            </p>
            <ul className="space-y-1 rounded-lg border border-border bg-muted/20 p-3">
              {myTeam.players.map((p) => (
                <li key={p.id} className="text-muted-foreground">
                  {rosterPlayerLabel(p)}
                  {!p.isStarter ? <span className="text-xs"> (запас)</span> : null}
                </li>
              ))}
            </ul>
            {registrationOpen ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => setEditing(true)}>
                  Изменить заявку
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    if (!window.confirm('Отозвать заявку команды? Состав будет удалён.')) return
                    void withdrawMutation.mutateAsync()
                  }}
                >
                  {withdrawMutation.isPending ? 'Отзыв…' : 'Отозвать заявку'}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Регистрация закрыта — изменить состав нельзя.</p>
            )}
          </div>
        ) : null}

        {user && isPlayer && !registrationOpen && !myTeam ? (
          <p className="text-muted-foreground">Приём заявок на этот турнир завершён.</p>
        ) : null}

        {showForm ? (
          <form
            className="space-y-5 border-t border-border pt-4"
            onSubmit={form.handleSubmit((values) => void onSubmit(values))}
            noValidate
          >
            <p className="text-muted-foreground">
              {myTeam
                ? 'Обновите название, логотип и состав — изменения сохранятся в заявке.'
                : 'Заполните данные команды и весь состав. Вы будете капитаном этой заявки.'}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="captain-team-name">Название команды</Label>
                <Input id="captain-team-name" autoComplete="off" {...form.register('name')} />
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="captain-team-logo" className="text-muted-foreground">
                  Логотип (ссылка, необязательно)
                </Label>
                <Input id="captain-team-logo" autoComplete="off" placeholder="https://…" {...form.register('logo')} />
                {form.formState.errors.logo ? (
                  <p className="text-xs text-destructive">{form.formState.errors.logo.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">Состав</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={fields.length >= 10}
                  onClick={() => append({ nickname: '', role: '', realName: '', country: '', rosterSlot: 'starter' })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Игрок
                </Button>
              </div>
              {form.formState.errors.players?.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.players.message}</p>
              ) : null}

              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border bg-muted/15 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Игрок {index + 1}
                    </span>
                    {fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        aria-label="Удалить игрока"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`captain-p-${index}-nick`}>Никнейм</Label>
                      <Input id={`captain-p-${index}-nick`} autoComplete="off" {...form.register(`players.${index}.nickname`)} />
                      {form.formState.errors.players?.[index]?.nickname ? (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.players[index]?.nickname?.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`captain-p-${index}-role`}>Роль</Label>
                      <Input
                        id={`captain-p-${index}-role`}
                        placeholder="IGL, Duelist…"
                        autoComplete="off"
                        {...form.register(`players.${index}.role`)}
                      />
                      {form.formState.errors.players?.[index]?.role ? (
                        <p className="text-xs text-destructive">{form.formState.errors.players[index]?.role?.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`captain-p-${index}-real`} className="text-muted-foreground">
                        Имя
                      </Label>
                      <Input id={`captain-p-${index}-real`} autoComplete="off" {...form.register(`players.${index}.realName`)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`captain-p-${index}-country`} className="text-muted-foreground">
                        Страна
                      </Label>
                      <Input id={`captain-p-${index}-country`} autoComplete="off" {...form.register(`players.${index}.country`)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`captain-p-${index}-slot`} className="text-muted-foreground">
                        Слот
                      </Label>
                      <select
                        id={`captain-p-${index}-slot`}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        {...form.register(`players.${index}.rosterSlot`)}
                      >
                        <option value="starter">Основной</option>
                        <option value="sub">Запасной</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Сохранение…' : myTeam ? 'Сохранить изменения' : 'Зарегистрировать команду'}
              </Button>
              {myTeam && editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => {
                    setEditing(false)
                    form.reset(captainTeamFormValuesFromTeam(myTeam))
                  }}
                >
                  Отмена
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  )
}
