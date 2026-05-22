import { Coins, Sparkles, Target, TrendingUp, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'
import type { ProfileFantasySummary } from '@/entities/profile/model/types'

type FantasyStatsWidgetsProps = {
  summary: ProfileFantasySummary
}

export function FantasyStatsWidgets({ summary }: FantasyStatsWidgetsProps) {
  const items = [
    {
      icon: Coins,
      label: 'Баланс очков',
      hint: 'Тот же баланс, что в магазине. Начисляется за прогнозы и бонусы, тратится на награды',
      value: summary.fantasyPointsBalance.toLocaleString('ru-RU'),
      href: '/fantasy-shop' as const,
    },
    {
      icon: Trophy,
      label: 'Очки в турнирах',
      hint: 'Сумма рейтинговых очков по всем составам (лидерборд): состав + прогнозы + бонусы',
      value: summary.tournamentPointsTotal.toLocaleString('ru-RU'),
    },
    {
      icon: Sparkles,
      label: 'Составов фэнтези',
      hint: 'Сколько турниров, где вы участвуете в фэнтези',
      value: String(summary.fantasyTeamCount),
    },
    {
      icon: TrendingUp,
      label: 'Среднее на состав',
      hint: 'Средний итог очков на один состав',
      value: summary.fantasyTeamCount === 0 ? '—' : String(summary.averagePointsPerTeam),
    },
    {
      icon: Target,
      label: 'Выбрано команд',
      hint: 'Сколько команд выбрано во всех составах суммарно',
      value: String(summary.totalPicks),
    },
  ] as const

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map(({ icon: Icon, label, hint, value, ...rest }) => {
        const href = 'href' in rest ? rest.href : undefined
        const content = (
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="truncate text-xl font-semibold tabular-nums text-foreground">{value}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{hint}</p>
            </div>
          </CardContent>
        )

        return href ? (
          <Link key={label} to={href} className="block rounded-xl transition-colors hover:bg-muted/30">
            <Card className="glass-panel h-full border-primary/20" title={hint}>
              {content}
            </Card>
          </Link>
        ) : (
          <Card key={label} className="glass-panel" title={hint}>
            {content}
          </Card>
        )
      })}
    </div>
  )
}
