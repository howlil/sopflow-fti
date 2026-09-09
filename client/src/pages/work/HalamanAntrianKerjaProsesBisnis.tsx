import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useSopSuspense } from '@/api/sop'
import { useMyAuthoringProsesBisnises } from '@/api/konteks-proses-bisnis'
import { pemeriksaanProsesBisnisApi } from '@/api/pemeriksaan-proses-bisnis'
import { queryClient } from '@/config/query-client'
import { queryKeys } from '@/config/query-keys'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table } from '@/components/ui/data-table'
import { SopDocumentPreviewPane } from '@/components/pengajuan/sop-document-preview-pane'
import { BuatSOPDialog } from '@/pages/penyusun/sop/components/BuatSOPDialog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { mapPenyusunWorkbenchToPreviewProps } from '@/lib/sop/detailSop.mappers'
import type {
  PenyusunWorkbenchData,
  ProsesBisnisSopLifecycleProjection,
  SopDaftarRow,
} from '@/types/dto/sop.dto'
import { ROUTES } from '@/utils/constants'

type ProsesBisnisAwareSopRow = SopDaftarRow & {
  prosesBisnisId?: string | null
  namaProsesBisnis?: string | null
  siklus: ProsesBisnisSopLifecycleProjection
}

function responsibilityLabel(siklus: ProsesBisnisSopLifecycleProjection): string {
  if (siklus.responsibility.type === 'CURRENT_USER') return 'Anda'
  if (siklus.responsibility.name) return siklus.responsibility.name
  if (siklus.responsibility.type === 'PROCESS_OWNER') return 'Penanggung Jawab Proses Bisnis'
  if (siklus.responsibility.type === 'DEAN') return 'Dekan'
  if (siklus.responsibility.type === 'HEAD_OF_DEPARTMENT') return 'Kepala Departemen'
  return '—'
}

export function HalamanAntrianKerjaProsesBisnis() {
  useDocumentTitle('Pekerjaan SOP')
  const { data: authoringProcesses = [] } = useMyAuthoringProsesBisnises()
  const { list, create } = useSopSuspense()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [reviewDocument, setReviewDocument] = useState<PenyusunWorkbenchData | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [catatan, setCatatan] = useState('')

  const rows = useMemo(
    () => (list as ProsesBisnisAwareSopRow[]).filter(
      (row) => row.prosesBisnisId != null && row.siklus != null,
    ),
    [list],
  )

  const openReview = async (detailSopId: string) => {
    setReviewId(detailSopId)
    setReviewDocument(null)
    setReviewError(null)
    setCatatan('')
    setReviewLoading(true)
    try {
      setReviewDocument(await pemeriksaanProsesBisnisApi.document(detailSopId))
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Dokumen SOP tidak dapat dimuat.')
    } finally {
      setReviewLoading(false)
    }
  }

  const decide = async (decision: 'REVISION' | 'ACCEPT') => {
    if (!reviewId || reviewSaving) return
    if (decision === 'REVISION' && catatan.trim().length === 0) {
      setReviewError('Catatan revisi wajib diisi.')
      return
    }
    setReviewSaving(true)
    setReviewError(null)
    try {
      await pemeriksaanProsesBisnisApi.decide(
        reviewId,
        decision,
        catatan.trim() || undefined,
      )
      await queryClient.invalidateQueries({ queryKey: queryKeys.sop })
      setReviewId(null)
      setReviewDocument(null)
      setCatatan('')
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Keputusan pemeriksaan gagal diproses.')
    } finally {
      setReviewSaving(false)
    }
  }

  return (
    <ListPageLayout
      title="Pekerjaan SOP"
      description="Satu daftar untuk melihat tahap, pihak yang bertanggung jawab, dan tindakan yang tersedia pada SOP dalam Proses Bisnis Anda."
      breadcrumb={null}
    >
      <div className="flex justify-end">
        {authoringProcesses.length > 0 ? (
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Buat SOP
          </Button>
        ) : null}
      </div>

      <Table.Card>
        <Table.Root aria-label="Pekerjaan SOP">
          <Table.Table>
            <thead>
              <Table.HeadRow>
                <Table.Th>Nomor</Table.Th>
                <Table.Th>SOP</Table.Th>
                <Table.Th>Proses Bisnis</Table.Th>
                <Table.Th>Tahap</Table.Th>
                <Table.Th>Tanggung Jawab</Table.Th>
                <Table.ActionTh>Aksi</Table.ActionTh>
              </Table.HeadRow>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <Table.BodyRow>
                  <Table.Td colSpan={6}>Belum ada pekerjaan SOP pada Proses Bisnis Anda.</Table.Td>
                </Table.BodyRow>
              ) : rows.map((row) => {
                const action = row.siklus.action
                const targetId = row.detailSopId ?? row.id
                return (
                  <Table.BodyRow key={row.id}>
                    <Table.Td>
                      {row.nomorSop ?? '—'}{row.versi ? <span className="text-xs text-secondary-foreground"> · v{row.versi}</span> : null}
                    </Table.Td>
                    <Table.Td className="font-medium">{row.judul}</Table.Td>
                    <Table.Td>{row.namaProsesBisnis ?? '—'}</Table.Td>
                    <Table.Td><Badge variant="outline">{row.siklus.stateLabel}</Badge></Table.Td>
                    <Table.Td>
                      <p>{responsibilityLabel(row.siklus)}</p>
                      {row.siklus.blockingReason ? (
                        <p className="mt-0.5 max-w-xs text-xs text-secondary-foreground">{row.siklus.blockingReason}</p>
                      ) : null}
                    </Table.Td>
                    <Table.ActionTd>
                      {action?.type === 'REVIEW_PROCESS' ? (
                        <Button size="sm" onClick={() => void openReview(targetId)}>Periksa SOP</Button>
                      ) : action?.destination === 'APPROVAL_INBOX' ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to={ROUTES.APPROVAL.INBOX}>{action.label}</Link>
                        </Button>
                      ) : action?.destination === 'SOP_DETAIL' ? (
                        <Button asChild size="sm" variant={action.type === 'OPEN' ? 'outline' : 'default'}>
                          <Link to={ROUTES.PENYUSUN.DETAIL_SOP} params={{ id: targetId }}>{action.label}</Link>
                        </Button>
                      ) : null}
                    </Table.ActionTd>
                  </Table.BodyRow>
                )
              })}
            </tbody>
          </Table.Table>
        </Table.Root>
      </Table.Card>

      <BuatSOPDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={async (payload) => { await create(payload) }}
      />

      <Dialog
        open={reviewId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewId(null)
            setReviewDocument(null)
            setReviewError(null)
            setCatatan('')
          }
        }}
      >
        <DialogContent className="flex h-[calc(100dvh-2rem)] max-w-6xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Pemeriksaan SOP</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden">
            <SopDocumentPreviewPane
              selectedSop={reviewId ? { nama: 'Dokumen SOP', nomor: reviewId } : null}
              isLoading={reviewLoading}
              sopPreviewProps={reviewDocument ? mapPenyusunWorkbenchToPreviewProps(reviewDocument) : null}
              tteSignaturePayload={reviewDocument?.tteSignaturePayload}
              errorMessage={reviewError ?? undefined}
              onRetry={reviewId ? () => void openReview(reviewId) : undefined}
            />
          </div>
          {reviewDocument ? (
            <div className="shrink-0 space-y-3 border-t border-border pt-3">
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Catatan pemeriksaan
                <textarea
                  value={catatan}
                  onChange={(event) => setCatatan(event.target.value)}
                  rows={3}
                  placeholder="Wajib diisi jika meminta revisi; opsional jika SOP siap diajukan."
                  className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={reviewSaving} onClick={() => void decide('REVISION')}>
                  Minta Revisi
                </Button>
                <Button disabled={reviewSaving} onClick={() => void decide('ACCEPT')}>
                  Nyatakan Siap Diajukan
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </ListPageLayout>
  )
}
