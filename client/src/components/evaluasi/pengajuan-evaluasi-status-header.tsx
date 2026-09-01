import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { StatusPengajuanEvaluasi } from '@/types/dto/evaluasi.dto'
import { getEvaluasiStatusBanner, type EvaluasiBannerRole } from '@/lib/evaluasi/evaluasi-status-copy'
import { PengajuanStatusBadge } from '@/components/status/pengajuan-status-badge'
import { EvaluasiStatusLegend } from '@/components/status/evaluasi-status-legend'
import { Button } from '@/components/ui/button'
import { EvaluasiWorkflowStepper } from './evaluasi-workflow-stepper'
import { cn } from '@/utils/cn'

export interface PengajuanEvaluasiStatusHeaderProps {
  status: StatusPengajuanEvaluasi | string
  statusLabel: string
  role?: EvaluasiBannerRole
  className?: string
  showLegend?: boolean
  /** Buka detail alur pengajuan evaluasi & banner saat pertama render. Default: tertutup. */
  defaultExpanded?: boolean
}

const BANNER_CLASS = {
  info: 'border-primary/20 bg-primary-subtle/60 text-primary-hover',
  success: 'border-success-subtle bg-success-subtle/70 text-success-foreground',
  warning: 'border-warning/30 bg-warning/10 text-warning-foreground',
  danger: 'border-danger/30 bg-danger/10 text-danger',
} as const

export function PengajuanEvaluasiStatusHeader({
  status,
  statusLabel,
  role = 'GENERAL',
  className,
  showLegend = true,
  defaultExpanded = false,
}: PengajuanEvaluasiStatusHeaderProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const banner = getEvaluasiStatusBanner(status, role)
  const panelId = 'pengajuan-evaluasi-status-detail'
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-secondary-foreground">Alur pengajuan evaluasi</span>
          <PengajuanStatusBadge status={status} label={statusLabel} showDomain={false} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
              Sembunyikan
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              Tampilkan alur
            </>
          )}
        </Button>
      </div>
      {expanded ? (
        <div id={panelId} className="space-y-2.5 border-t border-border pt-2.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <EvaluasiWorkflowStepper status={status} className="flex-1 min-w-[200px]" />
            {showLegend ? <EvaluasiStatusLegend /> : null}
          </div>
          {banner ? (
            <div
              className={cn(
                'rounded-md border px-3 py-2 text-xs leading-relaxed',
                BANNER_CLASS[banner.variant],
              )}
            >
              <p className="font-medium">{banner.title}</p>
              <p className="mt-0.5 opacity-90">{banner.message}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
