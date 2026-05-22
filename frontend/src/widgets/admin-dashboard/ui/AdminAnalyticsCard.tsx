import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/shared/lib/utils'

type AdminAnalyticsCardProps = {
  title: string
  value: string
  hint?: string
  icon: LucideIcon
  trend?: { label: string; positive?: boolean }
  loading?: boolean
  className?: string
  delay?: number
}

export function AdminAnalyticsCard({
  title,
  value,
  hint,
  icon: Icon,
  trend,
  loading = false,
  className,
  delay = 0,
}: AdminAnalyticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Card
        className={cn(
          'group h-full overflow-hidden border-primary/10 bg-card/80 shadow-glow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-glow',
          className,
        )}
      >
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-primary/15 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
          <CardTitle className="relative text-sm font-semibold text-muted-foreground">{title}</CardTitle>
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-glow-sm transition-transform duration-300 group-hover:scale-105">
            <Icon className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent className="relative">
          <div
            className={cn(
              'relative text-3xl font-extrabold tracking-tight text-foreground tabular-nums drop-shadow-[0_0_20px_hsl(var(--primary)/0.12)]',
              loading && 'animate-pulse text-muted-foreground/80',
            )}
          >
            {loading ? '…' : value}
          </div>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          {trend ? (
            <p
              className={cn(
                'mt-2 text-xs font-semibold',
                trend.positive === false ? 'text-destructive' : 'text-emerald-400/95',
              )}
            >
              {trend.label}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  )
}
