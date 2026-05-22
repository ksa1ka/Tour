import { motion } from 'framer-motion'

import { cn } from '@/shared/lib/utils'

export type AdminBarChartSeries = {
  key: string
  label: string
  colorClass: string
  values: number[]
}

type AdminSimpleBarChartProps = {
  labels: string[]
  series: AdminBarChartSeries[]
  className?: string
}

export function AdminSimpleBarChart({ labels, series, className }: AdminSimpleBarChartProps) {
  const max = Math.max(1, ...series.flatMap((s) => s.values))

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex min-h-[200px] items-end gap-1.5 sm:gap-2">
        {labels.map((label, i) => (
          <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-36 w-full items-end justify-center gap-0.5 sm:h-40">
              {series.map((s) => {
                const value = s.values[i] ?? 0
                const height = value === 0 ? 2 : Math.max(8, Math.round((value / max) * 100))
                return (
                  <motion.div
                    key={s.key}
                    title={`${s.label}: ${value}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.35, delay: i * 0.02 }}
                    className={cn('w-full max-w-[10px] rounded-t-sm opacity-90 sm:max-w-[14px]', s.colorClass)}
                  />
                )
              })}
            </div>
            <span className="w-full truncate text-center text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-sm', s.colorClass)} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
