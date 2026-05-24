import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/shared/lib/utils'

export type AdminTableColumn<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

type AdminCrudTableProps<T> = {
  columns: AdminTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  caption?: string
  emptyLabel?: string
  confirmDelete?: boolean
}

export function AdminCrudTable<T>({
  columns,
  data,
  getRowId,
  onView,
  onEdit,
  onDelete,
  caption,
  emptyLabel = 'Нет данных',
  confirmDelete = true,
}: AdminCrudTableProps<T>) {
  const hasRowActions = Boolean(onView || onEdit || onDelete)

  const handleDelete = (row: T) => {
    if (confirmDelete && typeof window !== 'undefined') {
      const ok = window.confirm('Удалить эту запись? Это действие нельзя отменить.')
      if (!ok) return
    }
    onDelete?.(row)
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-inner shadow-black/20">
      <Table>
        {caption ? <caption className="caption-top border-b border-border px-4 py-3 text-left text-sm text-muted-foreground">{caption}</caption> : null}
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {columns.map((col) => (
              <TableHead key={col.id} className={cn(col.className)}>
                {col.header}
              </TableHead>
            ))}
            {hasRowActions ? (
              <TableHead className="w-[52px] text-right">
                <span className="sr-only">Действия</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (hasRowActions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={getRowId(row)} className="border-border">
                {columns.map((col) => (
                  <TableCell key={col.id} className={cn(col.className)}>
                    {col.cell(row)}
                  </TableCell>
                ))}
                {hasRowActions ? (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="Действия">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {onView ? (
                          <DropdownMenuItem onSelect={() => onView(row)}>Просмотр</DropdownMenuItem>
                        ) : null}
                        {onEdit ? (
                          <DropdownMenuItem onSelect={() => onEdit(row)}>
                            <Pencil className="h-4 w-4" />
                            Изменить
                          </DropdownMenuItem>
                        ) : null}
                        {onDelete ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => handleDelete(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
