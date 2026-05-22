import { User } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { isAllowedImageSrc } from '@/shared/lib/imageUrl'
import { SafeImage } from '@/shared/ui/SafeImage'

function initialsFrom(email: string, displayName: string | null | undefined) {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

type ProfileAvatarProps = {
  email: string
  displayName?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass: Record<NonNullable<ProfileAvatarProps['size']>, string> = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-14 w-14 text-sm',
  lg: 'h-36 w-36 text-3xl',
}

function defaultAvatarContent(label: string, size: NonNullable<ProfileAvatarProps['size']>): ReactNode {
  if (label.length >= 2) {
    return label
  }
  return <User className={size === 'lg' ? 'h-14 w-14' : size === 'md' ? 'h-6 w-6' : 'h-4 w-4'} aria-hidden />
}

/**
 * Profile image with validation, loading pulse, broken-URL fallback, and letter/icon default.
 */
export function ProfileAvatar({ email, displayName, avatarUrl, size = 'md', className }: ProfileAvatarProps) {
  const label = initialsFrom(email, displayName)
  const box = cn(
    'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/50 font-semibold text-muted-foreground',
    sizeClass[size],
    className,
  )

  const fallback = (
    <div className="flex h-full w-full items-center justify-center" aria-hidden>
      {defaultAvatarContent(label, size)}
    </div>
  )

  const safeSrc = avatarUrl != null && isAllowedImageSrc(avatarUrl) ? avatarUrl : null

  if (!safeSrc) {
    return (
      <span className={box}>
        {defaultAvatarContent(label, size)}
      </span>
    )
  }

  return (
    <span className={cn(box, 'relative')}>
      <SafeImage
        src={safeSrc}
        alt={displayName?.trim() ? `Аватар: ${displayName}` : `Аватар пользователя ${email}`}
        fallback={fallback}
        className="absolute inset-0 h-full w-full"
        imgClassName="object-cover"
        loading="eager"
      />
    </span>
  )
}
