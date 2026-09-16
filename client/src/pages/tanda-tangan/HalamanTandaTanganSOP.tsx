import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, FileSignature, Loader2, ShieldCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useProsesBisnisTteQueue, processApprovalApi } from '@/api/persetujuan-akhir-sop'
import { useBulkTandaTanganiProsesBisnisSop } from '@/api/tte-proses-bisnis'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { PinVerificationDialog } from '@/components/tte/pin-verification-dialog'
import { TteSetupRequiredDialog } from '@/components/tte/tte-setup-required-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QueryState } from '@/components/ui/query-state'
import { Table } from '@/components/ui/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRequireTteSetup } from '@/hooks/use-require-tte-setup'
import { useToast } from '@/hooks/useToast'
import { buildSopArsipPdfBase64FromPreviewProps } from '@/lib/print/pengajuan-print'
import { mapPenyusunWorkbenchToPreviewProps } from '@/lib/sop/detailSop.mappers'
import { getSopStatusLabel } from '@/lib/status/sop-status.config'
import type { ProsesBisnisLifecycleSopDto } from '@/types/dto/persetujuan.dto'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function HalamanTandaTanganSOP() {
  const queue = useProsesBisnisTteQueue()
  const bulkSign = useBulkTandaTanganiProsesBisnisSop()
  const { showToast } = useToast()
  const { tteSetupDialogOpen, setTteSetupDialogOpen, requireTteReady, handleTteSigningError } = useRequireTteSetup()
  const [tab, setTab] = useState('pending')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pinDialogOpen, setPinDialogOpen] = useState(false)

  useEffect(() => {
    const available = new Set(queue.pending.map((item) => item.detailSopId))
    setSelectedIds((current) => current.filter((id) => available.has(id)))
  }, [queue.pending])

  const selectedItems = useMemo(
    () => queue.pending.filter((item) => selectedIds.includes(item.detailSopId)),
    [queue.pending, selectedIds],
  )
  const allSelected = queue.pending.length > 0 && selectedItems.length === queue.pending.length

  const toggleSelected = (detailSopId: string) => {
    setSelectedIds((current) => current.includes(detailSopId)
      ? current.filter((id) => id !== detailSopId)
      : [...current, detailSopId])
  }

  const openBulkDialog = () => {
    if (selectedItems.length === 0) return
    void requireTteReady(() => setPinDialogOpen(true))
  }

  const handlePinConfirm = async (pin: string): Promise<boolean> => {
    if (selectedItems.length === 0 || bulkSign.isPending) return false
    try {
      const items = []
      for (const item of selectedItems) {
        const document = await processApprovalApi.document(item.detailSopId)
        const preview = mapPenyusunWorkbenchToPreviewProps(document.workbench)
        const authorityLabel = document.authority.authority === 'DEAN' ? 'Dekan' : 'Kepala Departemen'
        const pdfBase64 = await buildSopArsipPdfBase64FromPreviewProps({
          ...preview,
          metadata: {
            ...preview.metadata,
            picName: document.authority.holderName,
            picNumber: document.authority.holderNip,
            picRole: authorityLabel,
          },
        })
        items.push({
          detailSopId: item.detailSopId,
          nomorDokumen: `${item.nomorSOP}-v${item.versi}`,
          judulDokumen: `Pengesahan ${item.judul}`,
          pdfBase64,
        })
      }
      const result = await bulkSign.mutateAsync({ pin, items })
      setSelectedIds(result.items.filter((item) => item.status === 'FAILED').map((item) => item.detailSopId))
      setPinDialogOpen(false)
      setTab(result.failedCount > 0 ? 'pending' : 'completed')
      if (result.failedCount > 0) {
        showToast(`${result.signedCount} SOP berhasil, ${result.failedCount} SOP gagal. Periksa hasil per item.`, 'error')
      }
      return true
    } catch (error) {
      handleTteSigningError(error, () => setPinDialogOpen(false))
      showToast(error instanceof Error ? error.message : 'Gagal menyiapkan dokumen untuk bulk TTE.', 'error')
      return false
    }
  }

  return (
    <>
      <ListPageLayout
        breadcrumb={[{ label: 'SOP' }, { label: 'Tanda Tangan Elektronik' }]}
        title="Tanda Tangan Elektronik SOP"
        description="Tandatangani SOP yang telah disetujui hasil pemeriksaannya oleh Penanggung Jawab Proses Bisnis. Satu PIN dapat memproses beberapa SOP sekaligus."
      >
        <DataSurface.Root>
          <DataSurface.Header>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Ruang Tanda Tangan Elektronik</h2>
                  <p className="text-xs text-secondary-foreground">{queue.pending.length} SOP menunggu penandatanganan dan {queue.completed.length} telah selesai</p>
                </div>
              </div>
              {tab === 'pending' ? (
                <Button type="button" className="gap-1.5" disabled={selectedItems.length === 0 || bulkSign.isPending} onClick={openBulkDialog}>
                  {bulkSign.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileSignature className="h-4 w-4" aria-hidden />}
                  Tandatangani {selectedItems.length > 0 ? `${selectedItems.length} SOP` : 'yang dipilih'}
                </Button>
              ) : null}
            </div>
          </DataSurface.Header>
          <QueryState isLoading={queue.isLoading} isError={queue.isError} onRetry={() => void queue.refetch()}>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <div className="border-b border-border px-3 pt-3">
                <TabsList variant="line" aria-label="Status tanda tangan">
                  <TabsTrigger value="pending" variant="line">Menunggu Tanda Tangan ({queue.pending.length})</TabsTrigger>
                  <TabsTrigger value="completed" variant="line">Telah Ditandatangani ({queue.completed.length})</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="pending" className="mt-0">
                  <Table.Root aria-label="SOP yang menunggu Tanda Tangan Elektronik">
                  <Table.Table>
                    <thead>
                      <Table.HeadRow>
                        <Table.Th className="w-10"><input type="checkbox" aria-label="Pilih semua SOP" checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? queue.pending.map((item) => item.detailSopId) : [])} /></Table.Th>
                        <Table.Th>SOP</Table.Th>
                        <Table.Th>Proses Bisnis</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.ActionTh>Aksi</Table.ActionTh>
                      </Table.HeadRow>
                    </thead>
                    <tbody>
                      {queue.pending.length === 0 ? (
                        <Table.BodyRow><Table.Td colSpan={5}><div className="p-6 text-center text-sm text-muted-foreground">Tidak ada SOP yang menunggu Tanda Tangan Elektronik.</div></Table.Td></Table.BodyRow>
                      ) : queue.pending.map((item: ProsesBisnisLifecycleSopDto & { prosesBisnisId: string; namaProsesBisnis: string }) => (
                        <Table.BodyRow key={item.detailSopId}>
                          <Table.Td><input type="checkbox" aria-label={`Pilih ${item.judul}`} checked={selectedIds.includes(item.detailSopId)} onChange={() => toggleSelected(item.detailSopId)} /></Table.Td>
                          <Table.Td><p className="font-medium text-foreground">{item.judul}</p><p className="text-xs text-secondary-foreground">{item.nomorSOP} · v{item.versi}</p></Table.Td>
                          <Table.Td><p className="text-sm text-foreground">{item.namaProsesBisnis}</p><p className="text-xs text-secondary-foreground">{item.siklus.responsibility.name ?? 'Pejabat Penandatangan'}</p></Table.Td>
                          <Table.Td><Badge variant="warning">Menunggu Tanda Tangan Elektronik</Badge></Table.Td>
                          <Table.ActionTd><Button asChild size="sm" variant="ghost" className="gap-1.5"><Link to="/sop/$id" params={{ id: item.detailSopId }}><Eye className="h-4 w-4" aria-hidden />Lihat</Link></Button></Table.ActionTd>
                        </Table.BodyRow>
                      ))}
                    </tbody>
                  </Table.Table>
                </Table.Root>
              </TabsContent>
              <TabsContent value="completed" className="mt-0">
                <Table.Root aria-label="SOP yang selesai ditandatangani">
                  <Table.Table>
                    <thead><Table.HeadRow><Table.Th>SOP</Table.Th><Table.Th>Status saat ini</Table.Th><Table.Th>Ditandatangani</Table.Th><Table.ActionTh>Aksi</Table.ActionTh></Table.HeadRow></thead>
                    <tbody>
                      {queue.completed.length === 0 ? (
                        <Table.BodyRow><Table.Td colSpan={4}><div className="p-6 text-center text-sm text-muted-foreground">Belum ada riwayat Tanda Tangan Elektronik dalam lingkup Anda.</div></Table.Td></Table.BodyRow>
                      ) : queue.completed.map((item) => (
                        <Table.BodyRow key={item.dokumenTteId}>
                          <Table.Td><p className="font-medium text-foreground">{item.dokumenTte.judulDokumen}</p><p className="text-xs text-secondary-foreground">{item.dokumenTte.nomorDokumen} · v{item.dokumenTte.detailSop.versi}</p></Table.Td>
                          <Table.Td><Badge variant={item.dokumenTte.detailSop.status === 'EFFECTIVE' ? 'success' : 'secondary'}>{getSopStatusLabel(item.dokumenTte.detailSop.status)}</Badge></Table.Td>
                          <Table.Td className="text-xs text-secondary-foreground">{formatDate(item.ditandatanganiPada)}</Table.Td>
                          <Table.ActionTd><Button asChild size="sm" variant="ghost" className="gap-1.5"><Link to="/sop/$id" params={{ id: item.dokumenTte.detailSopId }}><CheckCircle2 className="h-4 w-4" aria-hidden />Lihat</Link></Button></Table.ActionTd>
                        </Table.BodyRow>
                      ))}
                    </tbody>
                  </Table.Table>
                </Table.Root>
              </TabsContent>
            </Tabs>
          </QueryState>
        </DataSurface.Root>
      </ListPageLayout>
      <PinVerificationDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        title={`Tandatangani ${selectedItems.length} SOP`}
        description="Satu PIN akan digunakan untuk memproses semua SOP yang dipilih. Setiap SOP tetap divalidasi dan dicatat secara terpisah."
        confirmLabel="Tandatangani semua"
        onConfirm={handlePinConfirm}
      />
      <TteSetupRequiredDialog open={tteSetupDialogOpen} onOpenChange={setTteSetupDialogOpen} />
    </>
  )
}
