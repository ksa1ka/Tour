import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'

import { RealtimeChat } from './RealtimeChat'

type Tab = 'global' | 'tournament'

type TournamentChatsPanelProps = {
  tournamentId: string
  className?: string
}

export function TournamentChatsPanel({ tournamentId, className }: TournamentChatsPanelProps) {
  const [tab, setTab] = useState<Tab>('tournament')

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <Button
          type="button"
          size="sm"
          variant={tab === 'tournament' ? 'default' : 'ghost'}
          className={tab === 'tournament' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
          onClick={() => setTab('tournament')}
        >
          Чат турнира
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === 'global' ? 'default' : 'ghost'}
          className={tab === 'global' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
          onClick={() => setTab('global')}
        >
          Общий чат
        </Button>
      </div>

      {tab === 'tournament' ? (
        <RealtimeChat
          key={`t-${tournamentId}`}
          scope="tournament"
          tournamentId={tournamentId}
          title="Чат этого турнира"
          description="Сообщения видят все, кто открыл страницу турнира."
        />
      ) : (
        <RealtimeChat
          key="global"
          scope="global"
          title="Общий чат платформы"
          description="Общение со всеми пользователями Tour Arena."
        />
      )}
    </section>
  )
}
