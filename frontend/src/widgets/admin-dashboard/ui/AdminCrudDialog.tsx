import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type AdminCrudDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  primaryLabel?: string
  onPrimary?: () => void
  secondaryLabel?: string
}

export function AdminCrudDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  primaryLabel = 'Готово',
  onPrimary,
  secondaryLabel = 'Отмена',
}: AdminCrudDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children ? <div className="grid gap-3 py-2 text-sm text-muted-foreground">{children}</div> : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {secondaryLabel}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onPrimary?.()
              onOpenChange(false)
            }}
          >
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
