import { SafeImage } from '@/shared/ui/SafeImage'
import { cn } from '@/shared/lib/utils'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase()).join('')
}

export type PlayerAvatarProps = {
  nickname: string
  avatarUrl: string | null
  className?: string
  /** Text size for initials fallback */
  initialsClassName?: string
}

/** Square player portrait with pulse placeholder and initials fallback. */
export function PlayerAvatar({ nickname, avatarUrl, className, initialsClassName }: PlayerAvatarProps) {
  const letter = initials(nickname) || 'P'
  const fallback = (
    <div className="flex h-full w-full items-center justify-center">
      <span className={cn('font-semibold text-muted-foreground', initialsClassName ?? 'text-xs')}>{letter}</span>
    </div>
  )

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden border border-border bg-muted/40',
        'aspect-square max-h-full max-w-full min-h-0 min-w-0',
        className,
      )}
    >
      <SafeImage src={avatarUrl} alt={nickname} fallback={fallback} className="h-full w-full" />
    </div>
  )
}
