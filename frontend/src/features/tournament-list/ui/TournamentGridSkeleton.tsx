import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export function TournamentGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={item}>
          <Card className="glass-panel shadow-sm">
            <CardHeader className="space-y-3">
              <Skeleton className="h-5 w-[62%]" />
              <Skeleton className="h-3 w-[42%]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[78%]" />
              <div className="flex justify-end pt-2">
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
