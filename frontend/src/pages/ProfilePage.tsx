import { motion } from 'framer-motion'
import { Settings, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import {
  accountCategoryLabel,
  accountRoleBadgeVariant,
  isAdminRole,
} from '@/shared/lib/userAccountLabel'
import { useProfileQuery } from '@/features/profile/api/useProfileQuery'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageLoader } from '@/shared/ui/PageLoader'
import { FantasyEntriesPanel } from '@/widgets/profile-stats/ui/FantasyEntriesPanel'
import { FantasyStatsWidgets } from '@/widgets/profile-stats/ui/FantasyStatsWidgets'
import { ProfileAvatar } from '@/widgets/profile-stats/ui/ProfileAvatar'
import { TournamentHistoryPanel } from '@/widgets/profile-stats/ui/TournamentHistoryPanel'

export function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, isPending, isError, error } = useProfileQuery()

  if (!user) {
    return null
  }

  if (isPending) {
    return <PageLoader message="Загрузка профиля…" />
  }

  if (isError || !profile) {
    return (
      <PageContainer title="Профиль" tagline="Аккаунт" variant="narrow">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Не удалось загрузить профиль'}
        </p>
      </PageContainer>
    )
  }

  const title = (user.displayName ?? profile.displayName)?.trim() || user.email

  return (
    <PageContainer
      title={title}
      description={profile.bio ?? undefined}
      tagline="Профиль"
      actions={
        <Button asChild variant="outline" className="gap-2">
          <Link to="/profile/settings">
            <Settings className="h-4 w-4" />
            Настройки
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
            email={user.email}
            displayName={user.displayName ?? profile.displayName}
            avatarUrl={(user.avatarUrl?.trim() || profile.avatarUrl?.trim()) || null}
            size="lg"
            className="ring-2 ring-border"
          />
          <motion.div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={accountRoleBadgeVariant(user.role)}>{accountCategoryLabel(user.role)}</Badge>
              {isAdminRole(user.role) ? (
                <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                  <Shield className="h-3 w-3" aria-hidden />
                  Доступ к админ-панели
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              На платформе с {new Date(profile.memberSince).toLocaleDateString('ru-RU')}
            </p>
          </motion.div>
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
