import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { type TeamFormValues, teamFormSchema, teamPayloadFromForm } from '../model/teamFormSchema'

import { LogoUploadPlaceholder } from './LogoUploadPlaceholder'

type TeamFormProps = {
  defaultValues: TeamFormValues
  onSubmit: (payload: { name: string; logo: string | null }) => Promise<void>
  isSubmitting: boolean
  submitLabel: string
  idPrefix?: string
}

export function TeamForm({ defaultValues, onSubmit, isSubmitting, submitLabel, idPrefix = 'team' }: TeamFormProps) {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues,
  })

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(teamPayloadFromForm(values))
      })}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Название команды</Label>
        <Input id={`${idPrefix}-name`} autoComplete="off" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Логотип</Label>
        <LogoUploadPlaceholder previewUrl={form.watch('logo')} teamName={form.watch('name')} />
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-logo-url`} className="text-muted-foreground">
            Ссылка на логотип
          </Label>
          <Input
            id={`${idPrefix}-logo-url`}
            type="text"
            inputMode="url"
            placeholder="https://example.com/logo.png"
            autoComplete="off"
            {...form.register('logo')}
          />
          {form.formState.errors.logo && (
            <p className="text-xs text-destructive">{form.formState.errors.logo.message}</p>
          )}
        </div>
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
