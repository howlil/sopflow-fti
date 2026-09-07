import { Check, Circle, ExternalLink } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/utils/constants'
import type { ProsesBisnisSopLifecycleProjection } from '@/types/dto/sop.dto'

const LIFECYCLE_STAGES: Array<{
  key: ProsesBisnisSopLifecycleProjection['stage']
  label: string
}> = [
  { key: 'AUTHORING', label: 'Draft' },
  { key: 'PROCESS_REVIEW', label: 'Review Penanggung Jawab Proses Bisnis' },
  { key: 'FINAL_APPROVAL', label: 'Persetujuan akhir' },
  { key: 'TTE', label: 'TTE' },
  { key: 'EFFECTIVE', label: 'Berlaku' },
  { key: 'REVOKED', label: 'Dicabut' },
]

interface StatusProsesBisnisContextProps {
  siklus: ProsesBisnisSopLifecycleProjection
  namaProsesBisnis?: string | null
}

export function StatusProsesBisnisContext({
  siklus,
  namaProsesBisnis,
}: StatusProsesBisnisContextProps) {
  const currentIndex = LIFECYCLE_STAGES.findIndex((stage) => stage.key === siklus.stage)
  const actionDestination = siklus.action?.destination
  const nextStep = siklus.action?.label ??
    (siklus.blockingReason ? 'Menunggu pihak lain' : 'Tidak ada tindakan lanjutan')

  return (
    <Card className="mb-4 border-border shadow-surface" data-testid="siklus-proses-bisnis-context">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Lifecycle ProsesBisnis
            </p>
            <h3 className="text-sm font-semibold text-foreground">
              {namaProsesBisnis ?? 'Proses Bisnis SOP'}
            </h3>
          </div>
          <span className="text-sm font-medium text-foreground">{siklus.stateLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <ol
          className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-6"
          aria-label="Tahap siklus SOP"
        >
          {LIFECYCLE_STAGES.map((stage, index) => {
            const isCurrent = stage.key === siklus.stage
            const isComplete = currentIndex > index && siklus.stage !== 'REVOKED'
            return (
              <li
                key={stage.key}
                className="flex items-center gap-1.5 text-xs text-secondary-foreground"
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                ) : isCurrent ? (
                  <Circle className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" aria-hidden />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className={isCurrent ? 'font-semibold text-foreground' : undefined}>
                  {stage.label}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="flex flex-col gap-2 border-t border-border pt-3 text-xs">
          <p className="text-secondary-foreground">
            <span className="font-semibold text-foreground">Berikutnya: </span>
            {nextStep}
          </p>
          {siklus.responsibility.type !== 'NONE' ? (
            <p className="text-secondary-foreground">
              <span className="font-semibold text-foreground">Penanggung jawab: </span>
              {siklus.responsibility.name ?? 'Belum ditentukan'}
            </p>
          ) : null}
          {siklus.blockingReason ? (
            <p className="text-secondary-foreground">{siklus.blockingReason}</p>
          ) : null}
          {actionDestination === 'APPROVAL_INBOX' ? (
            <div>
              <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 px-2.5 text-xs">
                <Link to={ROUTES.APPROVAL.INBOX}>
                  {siklus.action?.label ?? 'Buka persetujuan'}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
