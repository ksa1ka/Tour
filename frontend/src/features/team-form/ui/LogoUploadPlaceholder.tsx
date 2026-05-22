import { ImageIcon } from 'lucide-react'

import { isAllowedImageSrc } from '@/shared/lib/imageUrl'
import { cn } from '@/shared/lib/utils'
import { TeamLogo } from '@/shared/ui/TeamLogo'

type LogoUploadPlaceholderProps = {
  className?: string
  /** Текущий URL из формы — показываем предпросмотр при валидном значении */
  previewUrl?: string
  teamName?: string
}

/** Зона под будущую загрузку файлов; предпросмотр по URL (https или data:image). */
export function LogoUploadPlaceholder({ className, previewUrl, teamName }: LogoUploadPlaceholderProps) {
  const name = teamName?.trim() || 'Команда'
  const showPreview = Boolean(previewUrl?.trim()) && isAllowedImageSrc(previewUrl)

  return (
    <div
      className={cn(
        'flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      {showPreview ? (
        <>
          <TeamLogo logoUrl={previewUrl!} teamName={name} size="lg" className="border-2 border-dashed border-primary/25" />
          <p className="text-xs text-muted-foreground">Предпросмотр логотипа</p>
        </>
      ) : (
        <>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground" aria-hidden>
            <ImageIcon className="h-5 w-5" aria-hidden />
          </span>
          <p className="max-w-[260px] leading-relaxed" aria-hidden>
            Вставьте ссылку на изображение ниже — предпросмотр обновится автоматически.
          </p>
        </>
      )}
    </div>
  )
}
