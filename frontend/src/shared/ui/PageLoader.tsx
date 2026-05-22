import { motion } from 'framer-motion'

import { transition } from '@/shared/lib/motion'
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner'

type PageLoaderProps = {
  message?: string
}

export function PageLoader({ message = 'Загрузка…' }: PageLoaderProps) {
  return (
    <motion.div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.fast}
    >
      <motion.div
        className="glass-panel rounded-2xl px-12 py-10"
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <LoadingSpinner size="lg" label={message} />
      </motion.div>
      <p className="text-sm font-medium tracking-wide text-muted-foreground">{message}</p>
    </motion.div>
  )
}
