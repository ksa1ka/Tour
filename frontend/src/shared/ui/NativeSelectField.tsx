import { forwardRef, type SelectHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/utils'

/** Стили нативного select в духе Input — тёмный фон, читаемый текст. */
export const nativeSelectClassName = cn(
  'flex h-11 min-h-[44px] w-full appearance-none rounded-xl border border-border bg-muted/40 px-4 py-2 text-base text-foreground shadow-inner-glow backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-200',
  'bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10',
  "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23a8b0bc%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')]",
  'focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

type NativeSelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string
  label: string
  /** Muted label for filters; default is standard form label weight */
  labelVariant?: 'default' | 'muted'
}

export const NativeSelectField = forwardRef<HTMLSelectElement, NativeSelectFieldProps>(
  ({ className, id, label, labelVariant = 'default', ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium',
            labelVariant === 'muted' ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {label}
        </label>
        <select ref={ref} id={id} className={cn(nativeSelectClassName, className)} {...props} />
      </div>
    )
  },
)
NativeSelectField.displayName = 'NativeSelectField'
