import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/shared/lib/utils'

export type AdminQuickAction = {
  label: string
  description?: string
  icon: LucideIcon
  to?: string
  onClick?: () => void
  variant?: 'default' | 'outline' | 'secondary'
}

type AdminQuickActionsProps = {
  title?: string
  description?: string
  actions: AdminQuickAction[]
  className?: string
}

export function AdminQuickActions({
  title = 'Быстрые действия',
  description = 'Частые операции без лишних кликов.',
  actions,
  className,
}: AdminQuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
    >
      <Card className={cn('border-border/90 bg-card/90 shadow-card backdrop-blur-md', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, i) => {
            const Icon = action.icon
            const variant = action.variant ?? 'outline'
            const inner = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/90 bg-muted/50 text-primary shadow-inner-glow transition-all duration-300 group-hover:border-primary/35 group-hover:bg-primary/10 group-hover:shadow-glow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-left">
                  <span className="block font-semibold tracking-tight">{action.label}</span>
                  {action.description ? (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{action.description}</span>
                  ) : null}
                </span>
              </>
            )
            if (action.to) {
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Button asChild variant={variant} className="group h-auto w-full justify-start gap-3 rounded-xl py-3.5">
                    <Link to={action.to}>{inner}</Link>
                  </Button>
                </motion.div>
              )
            }
            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
              >
                <Button
                  type="button"
                  variant={variant}
                  className="group h-auto w-full justify-start gap-3 rounded-xl py-3.5"
                  onClick={action.onClick}
                >
                  {inner}
                </Button>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}
