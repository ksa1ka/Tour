import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-semibold tracking-tight transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-glow-sm hover:bg-primary/92 hover:shadow-glow',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/88 hover:shadow-md',
        outline:
          'border border-border bg-card/40 text-foreground shadow-sm backdrop-blur-sm hover:border-primary/45 hover:bg-card/60 hover:text-foreground',
        secondary:
          'border border-border/80 bg-secondary text-secondary-foreground shadow-sm hover:border-border hover:bg-secondary/90 hover:shadow-md',
        ghost: 'text-foreground hover:bg-muted/80 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        neon:
          'border border-primary/50 bg-primary/10 text-primary shadow-glow-sm hover:border-primary/65 hover:bg-primary/16 hover:shadow-glow',
      },
      size: {
        default: 'h-11 min-h-[44px] px-5 py-2.5',
        sm: 'h-10 min-h-10 rounded-md px-4 text-sm [&_svg]:size-4',
        lg: 'h-12 min-h-12 rounded-md px-10 text-lg [&_svg]:size-6',
        icon: 'h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-md [&_svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
