import type { HTMLAttributes } from 'react'

import { cn } from '@/shared/lib/utils'

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shimmer-bg rounded-lg bg-muted/40', className)}
      {...props}
    />
  )
}

export { Skeleton }
