import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ClipboardCheck, FileText, Plus } from 'lucide-react'
import { useSopSuspense } from '@/api/sop'
import { useMyProsesBisnises } from '@/api/konteks-proses-bisnis'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { BuatSOPDialog } from '@/pages/penyusun/sop/components/BuatSOPDialog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import type { ProsesBisnisSopLifecycleProjection, SopDaftarRow } from '@/types/dto/sop.dto'
import { ROUTES } from '@/utils/constants'

type ProsesBisnisAwareSopRow = SopDaftarRow & {
  prosesBisnisId?: string | null
  namaProsesBisnis?: string | null
  siklus: ProsesBisnisSopLifecycleProjection
}

function WorkRow({
  row,
}: {
  row: ProsesBisnisAwareSopRow
}) {
  const { siklus } = row
  const action = siklus.action
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
          <Badge variant={isActionable ? 'warning' : 'secondary'}>{siklus.stateLabel}</Badge>
        </div>
        <p className="text-xs text-secondary-foreground">
            Proses Bisnis: <span className="font-medium text-foreground">{row.namaProsesBisnis ?? '—'}</span>
        </p>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p>
            {siklus.responsibility.type === 'CURRENT_USER'
              ? 'Tindakan Anda tersedia.'
              : siklus.blockingReason ?? 'Tidak ada tindakan saat ini.'}
          </p>
          {siklus.responsibility.type !== 'NONE' ? (
            <p className="mt-1 text-secondary-foreground">
              Berikutnya: {siklus.responsibility.name ?? siklus.responsibility.type}
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

export function HalamanAntrianKerjaProsesBisnis() {
  useDocumentTitle('Pekerjaan SOP')
  const { data: prosesBisnis = [] } = useMyProsesBisnises()
  const { list, create } = useSopSuspense()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const processRows = useMemo(
    () =>
      (list as ProsesBisnisAwareSopRow[]).filter(
        (row) => row.prosesBisnisId != null && row.siklus != null,
      ),
    [list],
  )
  const actionRows = useMemo(
    () =>
      processRows.filter(
        (row) => row.siklus.action !== null && row.siklus.action.type !== 'OPEN',
      ),
    [processRows],
  )
  const waitingRows = useMemo(
    () =>
      processRows.filter(
        (row) =>
          row.siklus.action === null &&
          row.siklus.stage !== 'EFFECTIVE' &&
          row.siklus.stage !== 'REVOKED',
      ),
    [processRows],
  )
  return (
    <ListPageLayout title="Pekerjaan SOP" breadcrumb={null}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">SOP pada Proses Bisnis Anda</p>
          <p className="mt-1 text-xs text-secondary-foreground">
            Lihat SOP yang perlu Anda kerjakan atau yang sedang menunggu pengguna lain.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)} disabled={prosesBisnis.length === 0}>
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
            description="SOP yang perlu Anda kerjakan akan muncul di sini."
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

      <div className="flex justify-end border-t border-border pt-3">
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.PENYUSUN.SOP}>Lihat semua SOP</Link>
        </Button>
      </div>

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
