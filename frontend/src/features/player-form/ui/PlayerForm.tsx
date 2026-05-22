import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { type PlayerFormValues, playerFormSchema, playerPayloadFromForm } from '../model/playerFormSchema'

type PlayerFormProps = {
  idPrefix: string
  defaultValues?: Partial<PlayerFormValues>
  onSubmit: (payload: ReturnType<typeof playerPayloadFromForm>) => Promise<void>
  isSubmitting: boolean
  submitLabel: string
}

const defaults: PlayerFormValues = {
  nickname: '',
  role: '',
  realName: '',
  country: '',
  avatar: '',
  rosterSlot: 'starter',
}

export function PlayerForm({ idPrefix, defaultValues, onSubmit, isSubmitting, submitLabel }: PlayerFormProps) {
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: { ...defaults, ...defaultValues },
  })

  return (
    <form
      className="space-y-3 border-t border-border pt-3"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(playerPayloadFromForm(values))
        form.reset({ ...defaults, ...defaultValues })
      })}
      noValidate
    >
      <p className="text-xs font-medium text-muted-foreground">Добавить игрока</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-nick`}>Никнейм</Label>
          <Input id={`${idPrefix}-nick`} autoComplete="off" {...form.register('nickname')} />
          {form.formState.errors.nickname ? (
            <p className="text-xs text-destructive">{form.formState.errors.nickname.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-role`}>Роль</Label>
          <Input id={`${idPrefix}-role`} placeholder="IGL, Duelist…" autoComplete="off" {...form.register('role')} />
          {form.formState.errors.role ? (
            <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-real`} className="text-muted-foreground">
            Имя (необязательно)
          </Label>
          <Input id={`${idPrefix}-real`} autoComplete="off" {...form.register('realName')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-country`} className="text-muted-foreground">
            Страна
          </Label>
          <Input id={`${idPrefix}-country`} autoComplete="off" {...form.register('country')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-avatar`} className="text-muted-foreground">
          Ссылка на фото
        </Label>
        <Input
          id={`${idPrefix}-avatar`}
          type="text"
          inputMode="url"
          placeholder="https://example.com/photo.jpg"
          autoComplete="off"
          {...form.register('avatar')}
        />
        {form.formState.errors.avatar ? (
          <p className="text-xs text-destructive">{form.formState.errors.avatar.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-slot`} className="text-muted-foreground">
          Слот в составе
        </Label>
        <select
          id={`${idPrefix}-slot`}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          {...form.register('rosterSlot')}
        >
          <option value="starter">Основной (starter)</option>
          <option value="sub">Запасной</option>
        </select>
      </div>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? 'Добавление…' : submitLabel}
      </Button>
    </form>
  )
}
