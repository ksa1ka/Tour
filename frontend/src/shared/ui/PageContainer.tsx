import { LayoutGroup, motion } from 'framer-motion'

import { transition } from '@/shared/lib/motion'
import { cn } from '@/shared/lib/utils'

import type { ReactNode } from 'react'

type PageContainerProps = {
  title: string
  description?: string
  tagline?: string
  /** Например аватар: слева от заголовка на sm+ и над мобильной колонкой. */
  titleAside?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  /** default: content column; narrow: forms; wide: турниры / сетка */
  variant?: 'default' | 'narrow' | 'wide'
}

export function PageContainer({
  title,
  description,
  tagline = 'Tour',
  titleAside,
  actions,
  children,
  className,
  variant = 'default',
}: PageContainerProps) {
  return (
    <LayoutGroup>
      <div
        className={cn(
          'mx-auto w-full max-w-full py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 sm:py-10 lg:px-10',
          variant === 'narrow' && 'max-w-lg',
          variant === 'default' && 'max-w-6xl xl:max-w-7xl',
          variant === 'wide' && 'max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem]',
          className,
        )}
      >
        <motion.div
          layout
          className="mb-10 flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition.base }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            {titleAside ? <div className="shrink-0 sm:pb-0.5">{titleAside}</div> : null}
            <div className="min-w-0 flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 rounded border border-border bg-card/80 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:text-[11px]">
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-primary" aria-hidden />
              {tagline}
            </div>
            <h1 className="font-display max-w-4xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
            ) : null}
            </div>
          </div>
          {actions ? (
            <div className="min-w-0 w-full shrink-0 sm:w-auto sm:max-w-[min(100%,42rem)] lg:max-w-[50%]">{actions}</div>
          ) : null}
        </motion.div>
        <motion.div
          layout
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.05, ease: transition.base.ease }}
        >
          {children}
        </motion.div>
      </div>
    </LayoutGroup>
  )
}
