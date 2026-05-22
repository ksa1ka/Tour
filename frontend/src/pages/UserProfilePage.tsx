import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useUserProfileQuery } from '@/features/profile/api/useUserProfileQuery'
import { accountCategoryLabel } from '@/shared/lib/userAccountLabel'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageLoader } from '@/shared/ui/PageLoader'
import { FantasyEntriesPanel } from '@/widgets/profile-stats/ui/FantasyEntriesPanel'
import { FantasyStatsWidgets } from '@/widgets/profile-stats/ui/FantasyStatsWidgets'
import { ProfileAvatar } from '@/widgets/profile-stats/ui/ProfileAvatar'
import { TournamentHistoryPanel } from '@/widgets/profile-stats/ui/TournamentHistoryPanel'

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const { data: profile, isPending, isError, error } = useUserProfileQuery(userId)

  if (!user) {
    return null
  }

  if (userId && user.id === userId) {
    return <Navigate to="/profile" replace />
  }

  if (!userId) {
    return <Navigate to="/tournaments" replace />
  }

  if (isPending) {
    return <PageLoader message="Загрузка профиля…" />
  }

  if (isError || !profile) {
    return (
      <PageContainer title="Профиль" tagline="Пользователь" variant="narrow">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Не удалось загрузить профиль'}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/tournaments">Назад</Link>
        </Button>
      </PageContainer>
    )
  }

  const title = profile.displayName?.trim() || 'Пользователь'

  return (
    <PageContainer
      title={title}
      description={profile.bio ?? undefined}
      tagline="Профиль пользователя"
      actions={
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/tournaments">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </Button>
      }
    >
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <ProfileAvatar
            email={`${profile.id}@profile`}
            displayName={profile.displayName}
            avatarUrl={profile.avatarUrl?.trim() || null}
            size="lg"
            className="ring-2 ring-border"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Категория: {accountCategoryLabel(profile.role)}
            </p>
            <p className="text-xs text-muted-foreground">
              На платформе с {new Date(profile.memberSince).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Статистика фэнтези</h2>
          <FantasyStatsWidgets summary={profile.fantasy.summary} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <TournamentHistoryPanel items={profile.tournamentHistory} />
          <FantasyEntriesPanel entries={profile.fantasy.entries} />
        </div>
      </motion.div>
    </PageContainer>
  )
}
