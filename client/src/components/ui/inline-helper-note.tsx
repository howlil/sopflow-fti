import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

export interface InlineHelperNoteProps {
  label?: string
  children: ReactNode
  tone?: 'neutral' | 'warning' | 'danger'
  className?: string
}

const toneClasses: Record<NonNullable<InlineHelperNoteProps['tone']>, string> = {
  neutral: 'border-border bg-surface-subtle/70 text-secondary-foreground',
  warning: 'border-warning/30 bg-warning/10 text-warning-foreground',
  danger: 'border-danger/30 bg-danger/10 text-danger',
}

export function InlineHelperNote({
  label,
  children,
  tone = 'neutral',
  className,
}: InlineHelperNoteProps) {
  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2 text-xs leading-relaxed',
        toneClasses[tone],
        className,
      )}
    >
      {label ? <span className="font-medium text-foreground">{label}: </span> : null}
      <span>{children}</span>
    </div>
  )
}
