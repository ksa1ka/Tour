import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfileQuery } from '@/features/profile/api/useProfileQuery'
import { useUpdateProfileMutation } from '@/features/profile/api/useUpdateProfileMutation'
import {
  type ProfileFormValues,
  profileFormSchema,
} from '@/features/profile-settings/model/profileFormSchema'
import { getRestErrorMessage } from '@/shared/lib/restErrors'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageLoader } from '@/shared/ui/PageLoader'
import { cn } from '@/shared/lib/utils'
import { ProfileAvatar } from '@/widgets/profile-stats/ui/ProfileAvatar'

const textareaClass =
  'flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-4 py-3 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export function ProfileSettingsPage() {
  const { data: profile, isPending, isError, error } = useProfileQuery()
  const mutation = useUpdateProfileMutation()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      avatarUrl: '',
    },
  })

  useEffect(() => {
    if (!profile) return
    form.reset({
      displayName: profile.displayName ?? '',
      bio: profile.bio ?? '',
      avatarUrl: profile.avatarUrl ?? '',
    })
  }, [profile, form])

  if (isPending) {
    return <PageLoader message="Загрузка…" />
  }

  if (isError || !profile) {
    return (
      <PageContainer title="Настройки профиля" tagline="Аккаунт" variant="narrow">
        <p className="text-sm text-destructive">{getRestErrorMessage(error, 'Не удалось загрузить профиль')}</p>
      </PageContainer>
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        displayName: values.displayName.trim() || null,
        bio: values.bio.trim() || null,
        avatarUrl: values.avatarUrl.trim() || null,
      })
      toast.success('Профиль сохранён')
    } catch (err) {
      form.setError('root', { message: getRestErrorMessage(err, 'Ошибка сохранения') })
    }
  })

  return (
    <PageContainer
      title="Настройки профиля"
      description="Имя, описание и ссылка на фото для аватара."
      tagline="Аккаунт"
      variant="narrow"
      actions={
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
          <Link to="/profile">К профилю</Link>
        </Button>
      }
    >
      <motion.form
        className="space-y-6"
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-4">
          <ProfileAvatar
            email={profile.email}
            displayName={form.watch('displayName') || profile.displayName}
            avatarUrl={form.watch('avatarUrl') || profile.avatarUrl}
            size="md"
          />
          <p className="text-sm text-muted-foreground">
            Превью аватара обновляется по мере ввода. Не забудьте нажать «Сохранить».
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Отображаемое имя</Label>
          <Input id="displayName" autoComplete="nickname" {...form.register('displayName')} />
          {form.formState.errors.displayName ? (
            <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">О себе</Label>
          <textarea id="bio" className={cn(textareaClass)} rows={4} {...form.register('bio')} />
          {form.formState.errors.bio ? (
            <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatarUrl">Ссылка на фото</Label>
          <Input
            id="avatarUrl"
            type="text"
            placeholder="https://example.com/photo.jpg"
            autoComplete="photo"
            {...form.register('avatarUrl')}
          />
          {form.formState.errors.avatarUrl ? (
            <p className="text-sm text-destructive">{form.formState.errors.avatarUrl.message}</p>
          ) : null}
        </div>

        {mutation.isError ? (
          <p className="text-sm text-destructive">
            {mutation.error instanceof Error ? mutation.error.message : 'Ошибка сохранения'}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </motion.form>
    </PageContainer>
  )
}
