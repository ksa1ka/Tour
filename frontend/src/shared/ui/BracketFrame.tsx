import { motion } from 'framer-motion'

import { EASE_OUT } from '@/shared/lib/motion'
import { cn } from '@/shared/lib/utils'

import type { ReactNode } from 'react'

type Corner = 'tl' | 'tr' | 'bl' | 'br'

const cornerClass: Record<Corner, string> = {
  tl: 'left-2.5 top-2.5 h-6 w-6 border-l-[3px] border-t-[3px] rounded-tl-sm',
  tr: 'right-2.5 top-2.5 h-6 w-6 border-r-[3px] border-t-[3px] rounded-tr-sm',
  bl: 'bottom-2.5 left-2.5 h-6 w-6 border-b-[3px] border-l-[3px] rounded-bl-sm',
  br: 'bottom-2.5 right-2.5 h-6 w-6 border-b-[3px] border-r-[3px] rounded-br-sm',
}

type BracketFrameProps = {
  children: ReactNode
  className?: string
  /** Corner accent color (Tailwind border color token) */
  accentClassName?: string
}

/**
 * Decorative corner brackets — subtle draw-in on mount, no layout shift.
 */
export function BracketFrame({ children, className, accentClassName = 'border-primary/35' }: BracketFrameProps) {
  const corners: Corner[] = ['tl', 'tr', 'bl', 'br']

  return (
    <div className={cn('relative', className)}>
      {corners.map((c, i) => (
        <motion.span
          key={c}
          className={cn('pointer-events-none absolute', cornerClass[c], accentClassName)}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.04 * i }}
          aria-hidden
        />
      ))}
      <div className="relative">{children}</div>
    </div>
  )
}
