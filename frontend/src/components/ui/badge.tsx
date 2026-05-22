import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/shared/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-[color,box-shadow,background-color] duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'border-primary/25 bg-primary/[0.08] text-primary shadow-sm hover:border-primary/35 hover:bg-primary/[0.12]',
        secondary: 'border-border/90 bg-secondary text-secondary-foreground hover:bg-secondary/90',
        destructive: 'border-destructive/35 bg-destructive/15 text-destructive-foreground hover:bg-destructive/25',
        outline: 'border-border text-foreground hover:border-primary/30 hover:text-primary',
        success: 'border-emerald-600/25 bg-emerald-600/[0.08] text-emerald-900 shadow-sm',
        warning: 'border-amber-600/25 bg-amber-500/[0.08] text-amber-950',
        neon: 'border-border bg-secondary text-primary hover:border-primary/35',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
