import { motion } from 'framer-motion'

import { cn } from '@/shared/lib/utils'

const sizes = {
  sm: 'h-5 w-5',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
}

type LoadingSpinnerProps = {
  className?: string
  size?: keyof typeof sizes
  label?: string
}

export function LoadingSpinner({ className, size = 'md', label = 'Загрузка' }: LoadingSpinnerProps) {
  return (
    <div
      className={cn('relative flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-live="polite"
    >
      <div className={cn('relative', sizes[size])} aria-hidden>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-muted/50"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/50"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.75, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-[3px] rounded-full border border-transparent border-b-primary/40"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.25, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
