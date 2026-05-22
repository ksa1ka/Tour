import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/shared/lib/utils'

type AdminChartPlaceholderProps = {
  title: string
  description?: string
  className?: string
  delay?: number
  footer?: ReactNode
  children?: ReactNode
  loading?: boolean
}

export function AdminChartPlaceholder({
  title,
  description,
  className,
  delay = 0,
  footer,
  children,
  loading = false,
}: AdminChartPlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay }}
    >
      <Card className={cn('border-border/90 bg-card/90 backdrop-blur-md', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </span>
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>
          {children ? (
            <div className="relative overflow-hidden rounded-xl border border-primary/15 bg-muted/10 px-3 py-4 sm:px-4 sm:py-5">
              {loading ? (
                <p className="py-16 text-center text-sm text-muted-foreground animate-pulse">Загрузка данных…</p>
              ) : (
                children
              )}
            </div>
          ) : (
            <div className="relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-primary/25 bg-muted/15 px-4 py-10 text-center sm:min-h-[220px]">
              <p className="relative text-sm font-semibold text-foreground">График (заглушка)</p>
              <p className="relative mt-1 max-w-sm text-xs text-muted-foreground">
                Когда понадобится аналитика по дням, сюда можно добавить наглядный график — блок уже подстроен под
                разные экраны.
              </p>
            </div>
          )}
          {footer ? <div className="mt-4">{footer}</div> : null}
        </CardContent>
      </Card>
    </motion.div>
  )
}
