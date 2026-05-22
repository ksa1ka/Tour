import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, className, action }: EmptyStateProps) {
  return (
    <motion.div
      className={cn(
        'glass-panel relative flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center',
        className,
      )}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-glow-sm">
        <Icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </motion.div>
  )
}
