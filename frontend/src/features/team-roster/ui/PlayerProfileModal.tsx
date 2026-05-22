import { Flag, Globe, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Player } from '@/entities/team/model/types'
import { PlayerAvatar } from '@/shared/ui/PlayerAvatar'

type PlayerProfileModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: Player | null
  teamName?: string
}

export function PlayerProfileModal({ open, onOpenChange, player, teamName }: PlayerProfileModalProps) {
  if (!player) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel overflow-hidden p-0 sm:max-w-xl">
        <div className="relative">
          <div className="h-28 w-full bg-primary/15" />
          <div className="absolute left-5 top-14 flex items-end gap-4">
            <PlayerAvatar
              nickname={player.nickname}
              avatarUrl={player.avatar}
              className="h-20 w-20 rounded-2xl shadow-xl"
              initialsClassName="text-lg"
            />
            <div className="pb-2">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{player.nickname}</span>
                  {player.isStarter ? <Badge variant="success">Starter</Badge> : <Badge variant="outline">Sub</Badge>}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {teamName ? <span className="text-foreground/80">{teamName}</span> : null}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-6 pb-6 pt-12 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
              <User className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Real name</div>
                <div className="truncate font-medium">{player.realName ?? '—'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
              <Flag className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Country</div>
                <div className="truncate font-medium">{player.country ?? '—'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
            <Globe className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Role</div>
              <div className="truncate font-medium">{player.role}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

