import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ClipboardCheck, FilePenLine, FileText, Plus } from 'lucide-react'
import { useSopSuspense } from '@/api/sop'
import { useMyProcesses } from '@/api/process-context'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { BuatSOPDialog } from '@/pages/penyusun/sop/components/BuatSOPDialog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useAuthStore } from '@/stores/authStore'
import type { SopDaftarRow } from '@/types/dto/sop.dto'
import { ROUTES } from '@/utils/constants'

type ProcessAwareSopRow = SopDaftarRow & {
  processId?: string | null
  processNama?: string | null
}

const AUTHORING_STATUSES = new Set(['DRAFT', 'SEDANG_DISUSUN', 'REVISI_DARI_EVALUATOR'])

function targetStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
    case 'SEDANG_DISUSUN':
      return 'Draft'
    case 'REVISI_DARI_EVALUATOR':
      return 'Perlu revisi'
    case 'SEDANG_DIEVALUASI':
      return 'Review Process Owner'
    case 'MENUNGGU_TTD_PJ_EVALUATOR':
      return 'Menunggu persetujuan akhir'
    case 'BERLAKU':
      return 'Berlaku'
    case 'DIGANTIKAN':
      return 'Digantikan'
    case 'DICABUT':
      return 'Dicabut'
    default:
      return status.replaceAll('_', ' ')
  }
}

function WorkRow({
  row,
  ownerProcessIds,
}: {
  row: ProcessAwareSopRow
  ownerProcessIds: ReadonlySet<string>
}) {
  const isOwnerReview =
    row.status === 'SEDANG_DIEVALUASI' &&
    row.processId != null &&
    ownerProcessIds.has(row.processId)
  const isAuthoring = AUTHORING_STATUSES.has(row.status)
  const targetId = row.detailSopId ?? row.id
  const actionLabel = isOwnerReview ? 'Review SOP' : isAuthoring ? 'Lanjutkan SOP' : 'Buka SOP'

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
          <Badge variant={isOwnerReview ? 'warning' : isAuthoring ? 'default' : 'secondary'}>
            {targetStatusLabel(row.status)}
          </Badge>
        </div>
        <p className="text-xs text-secondary-foreground">
          Process: <span className="font-medium text-foreground">{row.processNama ?? '—'}</span>
        </p>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          {isOwnerReview
            ? 'Menunggu keputusan Anda sebagai Process Owner.'
            : isAuthoring
              ? 'Dapat dilanjutkan oleh Process Owner atau Member.'
              : 'Tidak memerlukan tindakan authoring saat ini.'}
        </p>
        <Button asChild size="sm" variant={isOwnerReview ? 'default' : 'outline'} className="shrink-0 gap-1.5">
          <Link to={ROUTES.PENYUSUN.DETAIL_SOP} params={{ id: targetId }}>
            {isOwnerReview ? <ClipboardCheck className="h-4 w-4" aria-hidden /> : <FilePenLine className="h-4 w-4" aria-hidden />}
            {actionLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function ProcessWorkQueuePage() {
  useDocumentTitle('Pekerjaan SOP')
  const user = useAuthStore((state) => state.user)
  const { data: processes = [] } = useMyProcesses()
  const { list, create } = useSopSuspense()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const ownerProcessIds = useMemo(
    () => new Set(processes.filter((process) => process.ownerId === user?.penggunaId).map((process) => process.processId)),
    [processes, user?.penggunaId],
  )
  const processRows = useMemo(
    () => (list as ProcessAwareSopRow[]).filter((row) => row.processId != null),
    [list],
  )
  const actionRows = useMemo(
    () =>
      processRows.filter(
        (row) =>
          AUTHORING_STATUSES.has(row.status) ||
          (row.status === 'SEDANG_DIEVALUASI' && row.processId != null && ownerProcessIds.has(row.processId)),
      ),
    [ownerProcessIds, processRows],
  )
  const waitingRows = useMemo(
    () => processRows.filter((row) => !actionRows.includes(row)),
    [actionRows, processRows],
  )

  return (
    <ListPageLayout title="Pekerjaan SOP" breadcrumb={null}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Queue Process Anda</p>
          <p className="mt-1 text-xs text-secondary-foreground">
            Aksi ditentukan oleh hubungan Anda sebagai Process Owner atau Member, bukan role legacy akun.
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
              <WorkRow key={row.id} row={row} ownerProcessIds={ownerProcessIds} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardCheck}
            title="Tidak ada tindakan saat ini"
            description="Draft, revisi, atau review Process Owner yang membutuhkan Anda akan muncul di sini."
          />
        )}
      </section>

      {waitingRows.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-secondary-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">SOP Process lainnya</h2>
            <Badge variant="secondary">{waitingRows.length}</Badge>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {waitingRows.map((row) => (
              <WorkRow key={row.id} row={row} ownerProcessIds={ownerProcessIds} />
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
