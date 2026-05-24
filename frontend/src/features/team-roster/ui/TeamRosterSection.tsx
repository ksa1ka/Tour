import { Pencil, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { Player } from '@/entities/team/model/types'
import type { playerPayloadFromForm } from '@/features/player-form/model/playerFormSchema'
import { PlayerForm } from '@/features/player-form/ui/PlayerForm'
import { cn } from '@/shared/lib/utils'

import { PlayerCard } from './PlayerCard'
import { PlayerProfileModal } from './PlayerProfileModal'

export type RosterPlayerPayload = ReturnType<typeof playerPayloadFromForm>

type TeamRosterSectionProps = {
  teamName: string
  players: Player[]
  className?: string
  rosterAdmin?: {
    formIdPrefix: string
    onAdd: (payload: RosterPlayerPayload) => Promise<void>
    addPending: boolean
    onRemove: (playerId: string) => Promise<void>
    removePendingId: string | null
    onEdit?: (player: Player) => void
    editingPlayerId?: string | null
    hideAddForm?: boolean
  }
}

export function TeamRosterSection({ teamName, players, className, rosterAdmin }: TeamRosterSectionProps) {
  const [selected, setSelected] = useState<Player | null>(null)
  const [open, setOpen] = useState(false)

  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1
      return a.nickname.localeCompare(b.nickname)
    })
  }, [players])

  return (
    <div className={cn('mt-4 rounded-xl border border-border bg-muted/10 p-3', className)}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Users className="h-4 w-4" aria-hidden />
          Roster
        </div>
        <div className="text-xs text-muted-foreground">{players.length}</div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/10 px-3 py-3 text-xs text-muted-foreground">
          Игроков пока нет.
        </div>
      ) : (
        <div className="grid gap-2">
          {sorted.map((p) => (
            <div key={p.id} className="flex items-stretch gap-2">
              <div className="min-w-0 flex-1">
                <PlayerCard
                  player={p}
                  className={rosterAdmin?.editingPlayerId === p.id ? 'ring-2 ring-primary/50' : undefined}
                  onClick={(pl) => {
                    if (rosterAdmin?.onEdit) {
                      rosterAdmin.onEdit(pl)
                      return
                    }
                    setSelected(pl)
                    setOpen(true)
                  }}
                />
              </div>
              {rosterAdmin ? (
                <div className="flex shrink-0 items-center gap-0.5 self-center">
                  {rosterAdmin.onEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      title="Редактировать игрока"
                      onClick={(e) => {
                        e.stopPropagation()
                        rosterAdmin.onEdit?.(p)
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Удалить из состава"
                    disabled={rosterAdmin.removePendingId === p.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!window.confirm(`Удалить игрока «${p.nickname}» из состава?`)) return
                      void rosterAdmin.onRemove(p.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {rosterAdmin && !rosterAdmin.hideAddForm ? (
        <PlayerForm
          idPrefix={rosterAdmin.formIdPrefix}
          isSubmitting={rosterAdmin.addPending}
          submitLabel="Добавить в состав"
          onSubmit={rosterAdmin.onAdd}
        />
      ) : null}

      <PlayerProfileModal
        open={open}
        onOpenChange={(v) => setOpen(v)}
        player={selected}
        teamName={teamName}
      />
    </div>
  )
}

