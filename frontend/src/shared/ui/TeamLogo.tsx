import type { LucideIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { SafeImage } from '@/shared/ui/SafeImage'

export type TeamLogoProps = {
  logoUrl: string | null | undefined
  teamName: string
  /** Icon when no logo or load error */
  FallbackIcon?: LucideIcon
  className?: string
  /** Outer box: responsive square, scales with container */
  size?: 'sm' | 'md' | 'lg'
}

const boxSize: Record<NonNullable<TeamLogoProps['size']>, string> = {
  sm: 'h-9 w-9 min-h-9 min-w-9 sm:h-10 sm:w-10',
  md: 'h-12 w-12 min-h-12 min-w-12 sm:h-14 sm:w-14',
  lg: 'h-16 w-16 min-h-16 min-w-16 sm:h-20 sm:w-20',
}

const iconSize: Record<NonNullable<TeamLogoProps['size']>, string> = {
  sm: 'h-4 w-4 sm:h-5 sm:w-5',
  md: 'h-7 w-7 sm:h-8 sm:w-8',
  lg: 'h-9 w-9 sm:h-10 sm:w-10',
}

/**
 * Responsive square team logo with placeholder and safe URL handling.
 */
export function TeamLogo({ logoUrl, teamName, FallbackIcon, className, size = 'md' }: TeamLogoProps) {
  const Icon = FallbackIcon
  const initial = teamName.trim().slice(0, 1).toUpperCase() || '?'
  const fallback = Icon ? (
    <Icon className={cn('text-muted-foreground', iconSize[size])} aria-hidden />
  ) : (
    <span className={cn('font-semibold text-muted-foreground', size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm')}>
      {initial}
    </span>
  )

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40',
        'aspect-square max-h-full max-w-full',
        boxSize[size],
        className,
      )}
      aria-label={logoUrl ? `Логотип: ${teamName}` : `Команда: ${teamName}`}
    >
      <SafeImage src={logoUrl} alt={logoUrl ? `Эмблема ${teamName}` : ''} fallback={fallback} className="h-full w-full" showPlaceholder />
    </div>
  )
}
