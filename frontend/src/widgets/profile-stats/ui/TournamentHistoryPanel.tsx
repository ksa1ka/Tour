import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProfileTournamentHistoryItem } from '@/entities/profile/model/types'
import { tournamentFormatLabel, tournamentStatusLabel } from '@/shared/lib/tournamentLabels'
import { cn } from '@/shared/lib/utils'

function roleLabel(roles: ProfileTournamentHistoryItem['roles']) {
  const parts: string[] = []
  if (roles.includes('organizer')) parts.push('Организатор')
  if (roles.includes('fantasy')) parts.push('Fantasy')
  return parts.join(' · ')
}

type TournamentHistoryPanelProps = {
  items: ProfileTournamentHistoryItem[]
  className?: string
}

export function TournamentHistoryPanel({ items, className }: TournamentHistoryPanelProps) {
  return (
    <Card className={cn('glass-panel', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">История турниров</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет турниров — создайте или присоединитесь к fantasy.</p>
        ) : (
          items.map((row) => (
            <Link
              key={row.tournamentId}
              to={`/tournaments/${row.tournamentId}`}
              className="block rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-foreground">{row.title}</span>
                <span className="text-xs text-muted-foreground">{roleLabel(row.roles)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tournamentStatusLabel(row.status)} · {tournamentFormatLabel(row.format)}
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
