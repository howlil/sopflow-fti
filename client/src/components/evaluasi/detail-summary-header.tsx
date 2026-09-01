import type { ReactNode } from 'react'
import { PengajuanStatusBadge } from '@/components/status/pengajuan-status-badge'
import { cn } from '@/utils/cn'

export interface DetailSummaryMetadataItem {
  label: string
  value: ReactNode
}

export interface DetailSummaryHeaderProps {
  title: string
  status: string
  statusLabel: string
  summary: ReactNode
  supportingText?: ReactNode
  metadata?: DetailSummaryMetadataItem[]
  actions?: ReactNode
  menu?: ReactNode
  className?: string
}

function MetadataItem({ label, value }: DetailSummaryMetadataItem) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-xs font-medium text-foreground">
        {value}
      </dd>
    </div>
  )
}

export function DetailSummaryHeader({
  title,
  status,
  statusLabel,
  summary,
  supportingText,
  metadata = [],
  actions,
  menu,
  className,
}: DetailSummaryHeaderProps) {
  return (
    <section className={cn('rounded-surface border border-border bg-surface px-4 py-3 shadow-none', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <PengajuanStatusBadge status={status} label={statusLabel} showDomain={false} />
          </div>
          <div className="text-xs leading-relaxed text-secondary-foreground">{summary}</div>
          {supportingText ? (
            <div className="text-xs leading-relaxed text-muted-foreground">{supportingText}</div>
          ) : null}
        </div>
        {actions || menu ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 self-start lg:justify-end">
            {actions}
            {menu}
          </div>
        ) : null}
      </div>

      {metadata.length > 0 ? (
        <dl className="mt-3 grid gap-x-5 gap-y-2 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {metadata.map((item) => (
            <MetadataItem key={item.label} {...item} />
          ))}
        </dl>
      ) : null}
    </section>
  )
}
