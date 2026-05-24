import { motion } from 'framer-motion'
import {
  CalendarDays,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trophy,
  Upload,
  Users,
  UsersRound,
} from 'lucide-react'
import { useMemo } from 'react'

import { useAuth } from '@/context/AuthContext'
import { useAdminDashboardStatsQuery } from '@/features/admin/api/useAdminDashboardStatsQuery'
import {
  formatAdminCount,
  formatAdminPercentChange,
  formatShortDayLabel,
  tournamentStatusLabel,
} from '@/features/admin/lib/adminDashboardFormat'
import { ADMIN_ROUTES } from '@/shared/constants/adminRoutes'
import { AdminAnalyticsCard } from '@/widgets/admin-dashboard/ui/AdminAnalyticsCard'
import { AdminChartPlaceholder } from '@/widgets/admin-dashboard/ui/AdminChartPlaceholder'
import { AdminFunnelBreakdown } from '@/widgets/admin-dashboard/ui/AdminFunnelBreakdown'
import { AdminQuickActions } from '@/widgets/admin-dashboard/ui/AdminQuickActions'
import { AdminSimpleBarChart } from '@/widgets/admin-dashboard/ui/AdminSimpleBarChart'

export function AdminDashboardPage() {
  const { user } = useAuth()
  const { data: stats, isPending, isError, error, refetch, isFetching } = useAdminDashboardStatsQuery(
    user?.role === 'ADMIN',
  )

  const activityChart = useMemo(() => {
    if (!stats) return null
    const labels = stats.activityByDay.map((d) => formatShortDayLabel(d.date))
    return {
      labels,
      series: [
        {
          key: 'users',
          label: 'Новые пользователи',
          colorClass: 'bg-primary',
          values: stats.activityByDay.map((d) => d.newUsers),
        },
        {
          key: 'fantasy',
          label: 'Составы фэнтези',
          colorClass: 'bg-emerald-500/80',
          values: stats.activityByDay.map((d) => d.newFantasyTeams),
        },
        {
          key: 'teams',
          label: 'Команды турниров',
          colorClass: 'bg-amber-500/80',
          values: stats.activityByDay.map((d) => d.newTeams),
        },
      ],
    }
  }, [stats])

  const funnelSteps = useMemo(() => {
    if (!stats) return []
    const f = stats.fantasyFunnel
    return [
      { label: 'Все аккаунты', value: f.totalUsers },
      { label: 'Участвуют в фэнтези', value: f.withFantasyTeam },
      { label: 'Сделали прогнозы', value: f.withPredictions },
      {
        label: 'Турниры с фэнтези',
        value: f.tournamentsWithFantasy,
        hint: `${stats.fantasy.predictions.toLocaleString('ru-RU')} прогнозов всего`,
      },
    ]
  }, [stats])

  const tournamentStatusFooter = useMemo(() => {
    if (!stats) return null
    const entries = Object.entries(stats.tournaments.byStatus).sort((a, b) => b[1] - a[1])
    if (entries.length === 0) return null
    return (
      <p className="text-xs text-muted-foreground">
        {entries
          .slice(0, 4)
          .map(([status, n]) => `${tournamentStatusLabel(status)}: ${n}`)
          .join(' · ')}
      </p>
    )
  }, [stats])

  const loading = isPending && !stats

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Админ</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Панель <span className="text-primary">управления</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Сводка по платформе: пользователи, турниры, матчи, команды, фэнтези и магазин.
          {stats?.generatedAt ? (
            <span className="mt-1 block text-xs">
              Обновлено:{' '}
              {new Date(stats.generatedAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          ) : null}
        </p>
      </motion.div>

      {isError ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Не удалось загрузить статистику'}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-3">
        <AdminAnalyticsCard
          title="Пользователи"
          to={ADMIN_ROUTES.users}
          value={stats ? formatAdminCount(stats.users.total) : '—'}
          hint={
            stats
              ? `+${formatAdminCount(stats.users.last30Days)} за 30 дней · зрители ${stats.users.byRole.viewer}, игроки ${stats.users.byRole.player}`
              : undefined
          }
          icon={Users}
          trend={stats ? formatAdminPercentChange(stats.users.changePercent) : undefined}
          loading={loading}
          delay={0}
        />
        <AdminAnalyticsCard
          title="Турниры"
          to={ADMIN_ROUTES.tournaments}
          value={stats ? formatAdminCount(stats.tournaments.total) : '—'}
          hint={
            stats
              ? `${formatAdminCount(stats.tournaments.active)} активных · +${formatAdminCount(stats.tournaments.createdLast30Days)} за 30 дней`
              : undefined
          }
          icon={Trophy}
          trend={
            stats
              ? {
                  label: `${formatAdminCount(stats.tournaments.active)} в работе / открыты`,
                  positive: stats.tournaments.active > 0,
                }
              : undefined
          }
          loading={loading}
          delay={0.04}
        />
        <AdminAnalyticsCard
          title="Матчи"
          to={ADMIN_ROUTES.matches}
          value={stats ? formatAdminCount(stats.matches.total) : '—'}
          hint={
            stats
              ? `${formatAdminCount(stats.matches.played)} сыграно · ${formatAdminCount(stats.matches.scheduled)} запланировано`
              : undefined
          }
          icon={CalendarDays}
          trend={
            stats && stats.matches.total > 0
              ? {
                  label: `${Math.round((stats.matches.played / stats.matches.total) * 100)}% матчей завершено`,
                  positive: stats.matches.played >= stats.matches.scheduled,
                }
              : undefined
          }
          loading={loading}
          delay={0.08}
        />
        <AdminAnalyticsCard
          title="Команды"
          to={ADMIN_ROUTES.teams}
          value={stats ? formatAdminCount(stats.teams.total) : '—'}
          hint="все турнирные составы"
          icon={UsersRound}
          loading={loading}
          delay={0.1}
        />
        <AdminAnalyticsCard
          title="Фэнтези"
          to={ADMIN_ROUTES.fantasyLeague}
          value={stats ? formatAdminCount(stats.fantasy.fantasyTeams) : '—'}
          hint={
            stats
              ? `${formatAdminCount(stats.fantasy.uniqueParticipants)} участников · ${formatAdminCount(stats.fantasy.tournamentsWithFantasy)} турниров`
              : undefined
          }
          icon={Sparkles}
          trend={stats ? formatAdminPercentChange(stats.fantasy.changePercent) : undefined}
          loading={loading}
          delay={0.12}
        />
        <AdminAnalyticsCard
          title="Магазин"
          to={ADMIN_ROUTES.shopPurchases}
          value={stats ? formatAdminCount(stats.shop.purchases) : '—'}
          hint={
            stats
              ? `${formatAdminCount(stats.shop.rewards)} товаров · ${formatAdminCount(stats.shop.totalQuantitySold)} куплено шт.`
              : undefined
          }
          icon={ShoppingBag}
          trend={
            stats
              ? {
                  label: `${formatAdminCount(stats.shop.totalQuantitySold)} единиц куплено в магазине`,
                }
              : undefined
          }
          loading={loading}
          delay={0.14}
        />
      </div>

      <AdminQuickActions
        actions={[
          {
            label: 'Новый турнир',
            description: 'Мастер создания',
            icon: Plus,
            to: '/tournaments/new',
            variant: 'default',
          },
          {
            label: 'Пользователи',
            description: 'Просмотр и роли',
            icon: Users,
            to: ADMIN_ROUTES.users,
          },
          {
            label: 'Импорт расписания',
            description: 'Из файла (скоро)',
            icon: Upload,
            onClick: () => alert('Импорт из файла появится в следующих версиях.'),
          },
          {
            label: 'Обновить сводку',
            description: 'Перезагрузить метрики',
            icon: RefreshCw,
            onClick: () => void refetch(),
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <AdminChartPlaceholder
          title="Активность по дням"
          description="Новые регистрации, составы фэнтези и турнирные команды за последние 14 дней."
          delay={0.1}
          loading={loading}
          footer={tournamentStatusFooter}
        >
          {activityChart ? <AdminSimpleBarChart labels={activityChart.labels} series={activityChart.series} /> : null}
        </AdminChartPlaceholder>
        <AdminChartPlaceholder
          title="Воронка fantasy"
          description="Реальные шаги вовлечённости по данным из базы."
          delay={0.14}
          loading={loading}
        >
          {funnelSteps.length > 0 ? <AdminFunnelBreakdown steps={funnelSteps} /> : null}
        </AdminChartPlaceholder>
      </div>

      {isFetching && stats ? (
        <p className="text-center text-xs text-muted-foreground">Обновление показателей…</p>
      ) : null}
    </div>
  )
}
