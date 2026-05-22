import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

type FantasySelectionOrderListProps = {
  teamIds: string[]
  getTeamName: (teamId: string) => string
  onReorder: (nextIds: string[]) => void
  disabled?: boolean
}

function SortableRow({
  id,
  index,
  label,
  disabled,
}: {
  id: string
  index: number
  label: string
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-2 text-sm shadow-sm',
        isDragging && 'z-10 border-primary/40 bg-primary/10 opacity-90 ring-2 ring-primary/20',
        disabled && 'opacity-60',
      )}
    >
      <span className="w-6 shrink-0 tabular-nums text-center text-xs text-muted-foreground">{index}</span>
      <button
        type="button"
        className={cn(
          'flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border border-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground active:cursor-grabbing',
          disabled && 'pointer-events-none cursor-not-allowed',
        )}
        disabled={disabled}
        aria-label={`Переместить: ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{label}</span>
    </div>
  )
}

export function FantasySelectionOrderList({ teamIds, getTeamName, onReorder, disabled }: FantasySelectionOrderListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = teamIds.indexOf(String(active.id))
    const newIndex = teamIds.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove(teamIds, oldIndex, newIndex))
  }

  if (teamIds.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Перетащите строки за иконку слева, чтобы изменить порядок в составе.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={teamIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2" role="list">
            {teamIds.map((id, i) => (
              <li key={id} role="listitem">
                <SortableRow id={id} index={i + 1} label={getTeamName(id)} disabled={disabled} />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}
