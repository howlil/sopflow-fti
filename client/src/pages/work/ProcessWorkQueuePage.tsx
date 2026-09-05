import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ClipboardCheck, FileText, Plus } from 'lucide-react'
import { useSopSuspense } from '@/api/sop'
import { useMyProcesses } from '@/api/process-context'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { BuatSOPDialog } from '@/pages/penyusun/sop/components/BuatSOPDialog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import type { ProcessSopLifecycleProjection, SopDaftarRow } from '@/types/dto/sop.dto'
import { ROUTES } from '@/utils/constants'

type ProcessAwareSopRow = SopDaftarRow & {
  processId?: string | null
  processNama?: string | null
  lifecycle: ProcessSopLifecycleProjection
}

function WorkRow({
  row,
}: {
  row: ProcessAwareSopRow
}) {
  const { lifecycle } = row
  const action = lifecycle.action
  const targetId = row.detailSopId ?? row.id
  const isActionable = action !== null && action.type !== 'OPEN'

  return (
    <Card className="border-border shadow-surface">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{row.judul}</h3>
            <p className="mt-1 text-xs text-secondary-foreground">
              {row.nomorSop ?? 'Nomor belum tersedia'}
              {row.versi ? ` · v${row.versi}` : ''}
            </p>
          </div>
          <Badge variant={isActionable ? 'warning' : 'secondary'}>{lifecycle.stateLabel}</Badge>
        </div>
        <p className="text-xs text-secondary-foreground">
          Process: <span className="font-medium text-foreground">{row.processNama ?? '—'}</span>
        </p>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p>
            {lifecycle.responsibility.type === 'CURRENT_USER'
              ? 'Tindakan Anda tersedia.'
              : lifecycle.blockingReason ?? 'Tidak ada tindakan saat ini.'}
          </p>
          {lifecycle.responsibility.type !== 'NONE' ? (
            <p className="mt-1 text-secondary-foreground">
              Berikutnya: {lifecycle.responsibility.name ?? lifecycle.responsibility.type}
            </p>
          ) : null}
        </div>
        {action !== null ? (
          action.destination === 'APPROVAL_INBOX' ? (
            <Button asChild size="sm" variant={isActionable ? 'default' : 'outline'} className="shrink-0 gap-1.5">
              <Link to={ROUTES.APPROVAL.INBOX}>{action.label}</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant={isActionable ? 'default' : 'outline'} className="shrink-0 gap-1.5">
              <Link to={ROUTES.PENYUSUN.DETAIL_SOP} params={{ id: targetId }}>
                {isActionable ? <ClipboardCheck className="h-4 w-4" aria-hidden /> : null}
                {action.label}
              </Link>
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  )
}

export function ProcessWorkQueuePage() {
  useDocumentTitle('Pekerjaan SOP')
  const { data: processes = [] } = useMyProcesses()
  const { list, create } = useSopSuspense()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const processRows = useMemo(
    () =>
      (list as ProcessAwareSopRow[]).filter(
        (row) => row.processId != null && row.lifecycle != null,
      ),
    [list],
  )
  const actionRows = useMemo(
    () =>
      processRows.filter(
        (row) => row.lifecycle.action !== null && row.lifecycle.action.type !== 'OPEN',
      ),
    [processRows],
  )
  const waitingRows = useMemo(
    () =>
      processRows.filter(
        (row) =>
          row.lifecycle.action === null &&
          row.lifecycle.stage !== 'EFFECTIVE' &&
          row.lifecycle.stage !== 'REVOKED',
      ),
    [processRows],
  )
  const currentRows = useMemo(
    () => processRows.filter((row) => row.lifecycle.stage === 'EFFECTIVE' || row.lifecycle.stage === 'REVOKED'),
    [processRows],
  )

  return (
    <ListPageLayout title="Pekerjaan SOP" breadcrumb={null}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Daftar kerja Process Anda</p>
          <p className="mt-1 text-xs text-secondary-foreground">
            Tindakan ditentukan oleh tanggung jawab Anda sebagai Process Owner atau Member.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)} disabled={processes.length === 0}>
          <Plus className="h-4 w-4" aria-hidden />
          Buat SOP
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">Perlu tindakan saya</h2>
          <Badge>{actionRows.length}</Badge>
        </div>
        {actionRows.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {actionRows.map((row) => (
              <WorkRow key={row.id} row={row} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ClipboardCheck />}
            title="Tidak ada tindakan saat ini"
            description="Draft, revisi, atau review Process Owner yang memerlukan tindakan Anda akan muncul di sini."
          />
        )}
      </section>

      {waitingRows.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-secondary-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Menunggu pihak lain</h2>
            <Badge variant="secondary">{waitingRows.length}</Badge>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {waitingRows.map((row) => (
              <WorkRow key={row.id} row={row} />
            ))}
          </div>
        </section>
      ) : null}

      {currentRows.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-secondary-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Selesai / current</h2>
            <Badge variant="secondary">{currentRows.length}</Badge>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {currentRows.map((row) => (
              <WorkRow key={row.id} row={row} />
            ))}
          </div>
        </section>
      ) : null}

      <BuatSOPDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={async (payload) => {
          await create(payload)
        }}
      />
    </ListPageLayout>
  )
}
