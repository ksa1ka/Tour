import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { isAllowedImageSrc } from '@/shared/lib/imageUrl'

export type SafeImageProps = {
  src: string | null | undefined
  alt: string
  fallback: ReactNode
  className?: string
  imgClassName?: string
  /** Show pulse placeholder until load or error */
  showPlaceholder?: boolean
  /** eager — сразу после SPA-перехода; lazy по умолчанию */
  loading?: 'lazy' | 'eager'
}

/**
 * Renders an image only for allowed URL schemes, with loading placeholder and error fallback.
 * Container should set size (e.g. h-full w-full in a fixed box); image uses object-cover.
 */
export function SafeImage({
  src,
  alt,
  fallback,
  className,
  imgClassName,
  showPlaceholder = true,
  loading = 'lazy',
}: SafeImageProps) {
  const valid = src != null && isAllowedImageSrc(src)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useLayoutEffect(() => {
    setFailed(false)
    const img = imgRef.current
    if (!img || !valid) {
      setLoaded(false)
      return
    }
    // Кэш браузера: onLoad не срабатывает — иначе opacity остаётся 0 до F5
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true)
    } else {
      setLoaded(false)
    }
  }, [src, valid])

  if (!valid || failed) {
    return (
      <div className={cn('flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden', className)}>
        {fallback}
      </div>
    )
  }

  return (
    <div className={cn('relative h-full min-h-0 w-full min-w-0 overflow-hidden', className)}>
      {showPlaceholder && !loaded ? (
        <div
          className="absolute inset-0 z-0 animate-pulse bg-muted"
          aria-hidden
        />
      ) : null}
      <img
        ref={imgRef}
        key={src!.trim()}
        src={src!.trim()}
        alt={alt}
        className={cn(
          'relative z-[1] h-full w-full max-h-full max-w-full object-cover object-center',
          !loaded && 'opacity-0',
          loaded && 'opacity-100 transition-opacity duration-200',
          imgClassName,
        )}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
