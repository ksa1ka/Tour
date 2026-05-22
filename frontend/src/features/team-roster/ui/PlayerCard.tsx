import { motion } from 'framer-motion'
import { User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { Player } from '@/entities/team/model/types'
import { PlayerAvatar } from '@/shared/ui/PlayerAvatar'
import { cn } from '@/shared/lib/utils'

type PlayerCardProps = {
  player: Player
  onClick?: (player: Player) => void
  className?: string
}

export function PlayerCard({ player, onClick, className }: PlayerCardProps) {
  return (
    <motion.button
      type="button"
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl border border-border bg-muted/10 px-3 py-2 text-left',
        'transition-colors hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className,
      )}
      onClick={() => onClick?.(player)}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
    >
      <PlayerAvatar
        nickname={player.nickname}
        avatarUrl={player.avatar}
        className="h-10 w-10 rounded-xl"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate font-semibold tracking-tight">{player.nickname}</div>
          {player.isStarter ? <Badge variant="success">S</Badge> : <Badge variant="outline">Sub</Badge>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" aria-hidden />
            {player.role}
          </span>
          {player.country ? <span className="text-muted-foreground/80">{player.country}</span> : null}
        </div>
      </div>
    </motion.button>
  )
}

