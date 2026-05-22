import { AnimatePresence, motion } from 'framer-motion'
import { GripVertical, History } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'

import { cn } from '@/shared/lib/utils'
import type { BracketTeamDto } from '@/shared/api/services/matchService'

import { BRACKET_TEAM, type BracketTeamDragItem } from '../dnd/bracketDndTypes'

type BracketTeamSlotRowProps = {
  tournamentId: string
  matchId: string
  round: number
  side: 'A' | 'B'
  team: BracketTeamDto | null
  isWinner: boolean
  isDimmed: boolean
  /** Админ, 1-й раунд, матч без победителя — можно менять посев */
  seedingEditable: boolean
  swapDisabled: boolean
  /** Стыковка с соседним блоком «VS» в карточке матча */
  roundedPosition?: 'top' | 'bottom' | 'none'
  onTeamClick?: (team: BracketTeamDto) => void
  onSwapSlots: (payload: {
    fromMatchId: string
    fromSide: 'A' | 'B'
    toMatchId: string
    toSide: 'A' | 'B'
  }) => void
}

export function BracketTeamSlotRow({
  tournamentId,
  matchId,
  round,
  side,
  team,
  isWinner,
  isDimmed,
  seedingEditable,
  swapDisabled,
  roundedPosition = 'none',
  onTeamClick,
  onSwapSlots,
}: BracketTeamSlotRowProps) {
  const canDrag = seedingEditable && !swapDisabled && Boolean(team)
  const dropTargetActive = seedingEditable && !swapDisabled

  const [{ isDragging }, dragRef, previewRef] = useDrag<BracketTeamDragItem, void, { isDragging: boolean }>(
    () => ({
      type: BRACKET_TEAM,
      item: () => ({
        type: BRACKET_TEAM,
        tournamentId,
        matchId,
        round,
        side,
        team: team!,
      }),
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      canDrag: () => canDrag,
    }),
    [tournamentId, matchId, round, side, team, canDrag],
  )

  useEffect(() => {
    previewRef(getEmptyImage(), { captureDraggingState: true })
  }, [previewRef])

  const [{ isOver, canDrop }, dropRef] = useDrop<BracketTeamDragItem, void, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: BRACKET_TEAM,
      canDrop: (item) => {
        if (!dropTargetActive) return false
        if (item.matchId === matchId && item.side === side) return false
        if (item.round !== 1 || round !== 1) return false
        return true
      },
      drop: (item) => {
        onSwapSlots({
          fromMatchId: item.matchId,
          fromSide: item.side,
          toMatchId: matchId,
          toSide: side,
        })
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [dropTargetActive, matchId, side, round, onSwapSlots],
  )

  const highlight = isOver && canDrop

  const rowClass = useMemo(
    () =>
      cn(
        'flex min-h-[2.75rem] w-full items-center gap-1 text-left transition-[box-shadow,background-color,opacity,border-color] duration-200',
        roundedPosition === 'top' && 'rounded-t-lg',
        roundedPosition === 'bottom' && 'rounded-b-lg',
        roundedPosition === 'none' && 'rounded-lg',
        isWinner
          ? 'border border-primary/35 bg-primary/16 shadow-glow-sm ring-1 ring-primary/25'
          : 'border border-transparent bg-muted/[0.38]',
        isDimmed && 'opacity-45',
        highlight && 'border-primary/50 bg-primary/18 shadow-glow-sm ring-2 ring-primary/40',
        isDragging && 'opacity-40',
      ),
    [highlight, isDimmed, isDragging, isWinner, roundedPosition],
  )

  const showEmpty = !team

  const nameBlock =
    showEmpty ? null : onTeamClick ? (
      <button
        type="button"
        className="group/team flex min-h-0 min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={() => onTeamClick(team)}
      >
        <span className="min-w-0 truncate text-sm font-medium">{team.name}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <History
            className="h-3.5 w-3.5 text-muted-foreground opacity-60 transition-opacity group-hover/team:opacity-100"
            aria-hidden
          />
          {isWinner ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Победа</span>
          ) : null}
        </span>
      </button>
    ) : (
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2 py-1.5">
        <span className="min-w-0 truncate text-sm font-medium">{team.name}</span>
        {isWinner ? (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Победа</span>
        ) : null}
      </div>
    )

  return (
    <motion.div
      layout
      layoutId={`slot-${matchId}-${side}`}
      ref={(node) => {
        dropRef(node)
      }}
      transition={{ type: 'spring', stiffness: 440, damping: 34 }}
      className={cn(rowClass, showEmpty ? 'px-2.5 py-1.5' : 'pl-1 pr-0.5')}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {showEmpty ? (
          <motion.span
            key="empty-slot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex w-full items-center justify-center gap-2 text-sm font-medium tracking-[0.35em] text-muted-foreground/55"
          >
            <span className="h-px w-6 bg-border" aria-hidden />
            —
            <span className="h-px w-6 bg-border" aria-hidden />
          </motion.span>
        ) : (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ type: 'spring', stiffness: 480, damping: 36 }}
            className="flex min-h-0 w-full min-w-0 items-center gap-0"
          >
            {canDrag ? (
              <button
                type="button"
                ref={(node) => {
                  dragRef(node)
                }}
                aria-label="Перетащить команду"
                className="flex h-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border border-border/80 bg-muted/40 text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            {nameBlock}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
