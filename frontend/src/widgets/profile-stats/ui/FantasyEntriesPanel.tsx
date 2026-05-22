import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProfileFantasyEntry } from '@/entities/profile/model/types'
import { cn } from '@/shared/lib/utils'

type FantasyEntriesPanelProps = {
  entries: ProfileFantasyEntry[]
  className?: string
}

export function FantasyEntriesPanel({ entries, className }: FantasyEntriesPanelProps) {
  return (
    <Card className={cn('glass-panel', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Составы фэнтези</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Составов пока нет.</p>
        ) : (
          entries.map((e) => (
            <div
              key={e.fantasyTeamId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/25 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{e.name ?? 'Без названия'}</p>
                <p className="text-xs text-muted-foreground">
                  <Link to={`/tournaments/${e.tournamentId}/fantasy`} className="text-primary hover:underline">
                    {e.tournamentTitle}
                  </Link>
                  {' · '}
                  {e.picksCount} команд в составе
                </p>
              </div>
              <span className="shrink-0 rounded-md border border-border bg-card px-2 py-1 text-sm font-semibold tabular-nums text-foreground">
                {e.points} очков
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
