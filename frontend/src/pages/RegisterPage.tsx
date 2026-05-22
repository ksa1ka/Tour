import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegisterMutation } from '@/features/auth/api/useAuthMutations'
import { type RegisterFormValues, registerSchema } from '@/features/auth/model/registerSchema'
import { getAuthRequestErrorMessage } from '@/shared/lib/authErrors'
import { AuthFormLayout } from '@/shared/ui/AuthFormLayout'

export function RegisterPage() {
  const { user } = useAuth()
  const registerMutation = useRegisterMutation()

  if (user) {
    return <Navigate to="/tournaments/matches" replace />
  }

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', accountRole: 'VIEWER' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync(values)
    } catch (err) {
      form.setError('root', { message: getAuthRequestErrorMessage(err, 'register') })
    }
  })

  return (
    <AuthFormLayout
      title="Регистрация"
      description="Выберите категорию: зритель или игрок. Учётные записи администраторов создаёт владелец системы."
      footer={
        <p className="text-center text-xs text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Войти
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input id="register-email" type="email" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Пароль</Label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium leading-none">Категория</legend>
          <p className="text-xs text-muted-foreground">Зритель — следить за турнирами; игрок — участвовать как игрок платформы.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                className="h-4 w-4 accent-primary"
                value="VIEWER"
                {...form.register('accountRole')}
              />
              Зритель
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" className="h-4 w-4 accent-primary" value="PLAYER" {...form.register('accountRole')} />
              Игрок
            </label>
          </div>
          {form.formState.errors.accountRole && (
            <p className="text-xs text-destructive">{form.formState.errors.accountRole.message}</p>
          )}
        </fieldset>
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}
        <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Регистрация…' : 'Зарегистрироваться'}
        </Button>
      </form>
    </AuthFormLayout>
  )
}
