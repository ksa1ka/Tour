import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect } from 'react'
import { useDragLayer } from 'react-dnd'

import { cn } from '@/shared/lib/utils'

import { BRACKET_TEAM, type BracketTeamDragItem } from '../dnd/bracketDndTypes'

export function BracketTeamDragLayer() {
  const { itemType, isDragging, item, clientOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as BracketTeamDragItem | null,
    itemType: monitor.getItemType(),
    clientOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }))

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 520, damping: 38, mass: 0.35 })
  const sy = useSpring(y, { stiffness: 520, damping: 38, mass: 0.35 })

  useEffect(() => {
    if (!isDragging || !clientOffset) return
    x.set(clientOffset.x)
    y.set(clientOffset.y)
  }, [isDragging, clientOffset, x, y])

  if (!isDragging || itemType !== BRACKET_TEAM || !item?.team) {
    return null
  }

  return (
    <motion.div
      className={cn(
        'pointer-events-none fixed left-0 top-0 z-[80] flex max-w-[min(18rem,calc(100vw-1.5rem))] items-center gap-2',
        'rounded-lg border border-primary/40 bg-card/95 px-3 py-2 shadow-lg ring-2 ring-primary/25 backdrop-blur-sm',
      )}
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    >
      <span className="truncate text-sm font-semibold">{item.team.name}</span>
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Слот</span>
    </motion.div>
  )
}
