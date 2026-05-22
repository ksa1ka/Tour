import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTeamTournamentHistory } from '@/features/team-tournament-history/api/useTeamTournamentHistory'

import { TeamMatchHistorySection } from './TeamMatchHistorySection'
import { TeamPathTimeline } from './TeamPathTimeline'

export type TeamHistoryModalTeam = {
  id: string
  name: string
}

type TeamHistoryModalProps = {
  tournamentId: string
  team: TeamHistoryModalTeam | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamHistoryModal({ tournamentId, team, open, onOpenChange }: TeamHistoryModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const q = useTeamTournamentHistory(tournamentId, team?.id ?? null, open)

  useEffect(() => {
    if (open) setSelectedIndex(0)
  }, [open, team?.id])

  useEffect(() => {
    const n = q.data?.steps.length ?? 0
    if (n > 0 && selectedIndex > n - 1) setSelectedIndex(n - 1)
  }, [q.data?.steps.length, selectedIndex])

  const steps = q.data?.steps ?? []
  const bracketTotalRounds = q.data?.bracketTotalRounds ?? 0
  const displayName = q.data?.team.name ?? team?.name ?? 'Команда'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,40rem)] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Путь команды в турнире</DialogTitle>
          <DialogDescription>
            Матчи, соперники и результаты по сетке. Данные обновляются вместе с турнирной таблицей.
          </DialogDescription>
        </DialogHeader>

        {q.isPending ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Загрузка истории…
          </div>
        ) : q.isError ? (
          <p className="py-6 text-center text-sm text-destructive">Не удалось загрузить историю команды.</p>
        ) : (
          <div className="space-y-8 pt-1">
            <TeamPathTimeline
              steps={steps}
              bracketTotalRounds={bracketTotalRounds}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
            />
            <TeamMatchHistorySection
              steps={steps}
              bracketTotalRounds={bracketTotalRounds}
              teamName={displayName}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
