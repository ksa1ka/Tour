import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/features/auth/api/useAuthMutations'
import { type LoginFormValues, loginSchema } from '@/features/auth/model/loginSchema'
import { getAuthRequestErrorMessage } from '@/shared/lib/authErrors'
import { AuthFormLayout } from '@/shared/ui/AuthFormLayout'

export function LoginPage() {
  const { user } = useAuth()
  const loginMutation = useLoginMutation()

  if (user) {
    return <Navigate to="/tournaments/matches" replace />
  }

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values)
    } catch (err) {
      form.setError('root', { message: getAuthRequestErrorMessage(err, 'login') })
    }
  })

  return (
    <AuthFormLayout
      title="Вход"
      description="Введите email и пароль."
      footer={
        <p className="text-center text-xs text-muted-foreground">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-foreground underline-offset-4 hover:underline">
            Зарегистрироваться
          </Link>
          {' · '}
          <Link to="/">На главную</Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}
        <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Вход…' : 'Войти'}
        </Button>
      </form>
    </AuthFormLayout>
  )
}
