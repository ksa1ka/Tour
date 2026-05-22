import { cn } from '@/shared/lib/utils'

export type AdminFunnelStep = {
  label: string
  value: number
  hint?: string
}

type AdminFunnelBreakdownProps = {
  steps: AdminFunnelStep[]
  className?: string
}

export function AdminFunnelBreakdown({ steps, className }: AdminFunnelBreakdownProps) {
  const top = steps[0]?.value ?? 0

  return (
    <ul className={cn('space-y-3', className)}>
      {steps.map((step, index) => {
        const width = top > 0 ? Math.max(6, Math.round((step.value / top) * 100)) : 0
        const prev = index > 0 ? steps[index - 1]?.value ?? 0 : null
        const conversion =
          prev != null && prev > 0 ? `${Math.round((step.value / prev) * 100)}% от предыдущего шага` : null

        return (
          <li key={step.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-foreground">{step.label}</span>
              <span className="tabular-nums font-bold text-foreground">{step.value.toLocaleString('ru-RU')}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-primary/70 transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
            {step.hint ? <p className="mt-1 text-xs text-muted-foreground">{step.hint}</p> : null}
            {conversion ? <p className="mt-0.5 text-xs text-muted-foreground">{conversion}</p> : null}
          </li>
        )
      })}
    </ul>
  )
}
