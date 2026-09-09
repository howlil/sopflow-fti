import { useState } from 'react'
import { Ban, Check, Eye, FileSignature, Loader2, ShieldCheck } from 'lucide-react'
import { processApprovalApi, useProsesBisnisApprovalQueue } from '@/api/persetujuan-akhir-sop'
import { useProsesBisnisRevocationQueue } from '@/api/pencabutan-sop'
import { useTandaTanganiProsesBisnisSop } from '@/api/tte-proses-bisnis'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { PinVerificationDialog } from '@/components/tte/pin-verification-dialog'
import { TteSetupRequiredDialog } from '@/components/tte/tte-setup-required-dialog'
import { SopDocumentPreviewPane } from '@/components/pengajuan/sop-document-preview-pane'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRequireTteSetup } from '@/hooks/use-require-tte-setup'
import { useToast } from '@/hooks/useToast'
import { buildSopArsipPdfBase64FromPreviewProps } from '@/lib/print/pengajuan-print'
import { mapPenyusunWorkbenchToPreviewProps } from '@/lib/sop/detailSop.mappers'

export function HalamanPersetujuanAkhirSOP() {
  const { rows, isLoading, approve, isApproving } = useProsesBisnisApprovalQueue()
  const {
    rows: revocationRows,
    isLoading: isLoadingRevocations,
    revoke,
    isRevoking,
  } = useProsesBisnisRevocationQueue()
  const signProsesBisnisSop = useTandaTanganiProsesBisnisSop({ suppressSetupRequiredToast: true })
  const {
    tteSetupDialogOpen,
    setTteSetupDialogOpen,
    requireTteReady,
    handleTteSigningError,
  } = useRequireTteSetup()
  const { showToast } = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [signingId, setSigningId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [inspectId, setInspectId] = useState<string | null>(null)
  const [inspectDocument, setInspectDocument] = useState<Awaited<ReturnType<typeof processApprovalApi.document>> | null>(null)
  const [inspectError, setInspectError] = useState<string | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const selected = rows.find((row) => row.detailSopId === selectedId) ?? null
  const signing = rows.find((row) => row.detailSopId === signingId) ?? null
  const revoking = revocationRows.find((row) => row.detailSopId === revokingId) ?? null

  const handleOpenSigning = (detailSopId: string) => {
    void requireTteReady(() => setSigningId(detailSopId))
  }

  const openInspection = async (detailSopId: string) => {
    setInspectId(detailSopId)
    setInspectDocument(null)
    setInspectError(null)
    setIsInspecting(true)
    try {
      setInspectDocument(await processApprovalApi.document(detailSopId))
    } catch (error) {
      setInspectError(error instanceof Error ? error.message : 'Dokumen SOP tidak dapat dimuat.')
    } finally {
      setIsInspecting(false)
    }
  }

  const handlePinConfirm = async (pin: string): Promise<boolean> => {
    if (signing === null || signProsesBisnisSop.isPending) return false
    let signingRequestStarted = false
    try {
      const document = await processApprovalApi.document(signing.detailSopId)
      const preview = mapPenyusunWorkbenchToPreviewProps(document.workbench)
      const authorityLabel =
        document.authority.authority === 'DEAN' ? 'Dekan' : 'Kepala Departemen'
      const pdfBase64 = await buildSopArsipPdfBase64FromPreviewProps({
        ...preview,
        metadata: {
          ...preview.metadata,
          picName: document.authority.holderName,
          picNumber: document.authority.holderNip,
          picRole: authorityLabel,
        },
      })

      signingRequestStarted = true
      await signProsesBisnisSop.mutateAsync({
        detailSopId: signing.detailSopId,
        payload: {
          pin,
          nomorDokumen: `${signing.nomorSOP}-v${signing.versi}`,
          judulDokumen: `Pengesahan ${signing.judul}`,
          pdfBase64,
        },
      })
      setSigningId(null)
      return true
    } catch (error) {
      handleTteSigningError(error, () => setSigningId(null))
      if (!signingRequestStarted) {
        showToast(
          error instanceof Error ? error.message : 'Gagal menyiapkan dokumen resmi SOP.',
          'error',
        )
      }
      return false
    }
  }

  return (
    <>
      <ListPageLayout
        breadcrumb={[{ label: 'SOP' }, { label: 'Persetujuan Akhir' }]}
        title="Persetujuan Akhir"
      >
        <DataSurface.Root>
          <DataSurface.Header>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">SOP dalam kewenangan Anda</h2>
              <p className="text-sm text-secondary-foreground">
                Persetujuan akhir mengikuti lingkup Proses Bisnis: Dekan untuk Proses Bisnis fakultas dan Kepala Departemen untuk Proses Bisnis departemen. Setelah disetujui, pejabat yang sama menyelesaikan TTE agar SOP berlaku.
              </p>
            </div>
          </DataSurface.Header>
          <div className="divide-y divide-border">
            {isLoading ? (
              <p className="p-4 text-sm text-secondary-foreground">Memuat persetujuan...</p>
            ) : rows.length === 0 ? (
              <p className="p-4 text-sm text-secondary-foreground">Tidak ada SOP yang menunggu persetujuan atau TTE Anda.</p>
            ) : (
              rows.map((row) => (
                <div key={row.detailSopId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground">{row.judul}</h3>
                      <Badge variant="outline">
                        {row.lingkup === 'FACULTY' ? 'Fakultas · Dekan' : `${row.departmentNama ?? 'Departemen'} · Kepala Departemen`}
                      </Badge>
                    </div>
                    <p className="text-sm text-secondary-foreground">
                      {row.nomorSOP} · v{row.versi} · Proses Bisnis {row.namaProsesBisnis}
                    </p>
                    {row.approval ? (
                      <p className="inline-flex items-center gap-1 text-xs font-medium text-secondary-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                        Persetujuan akhir tercatat · siap TTE
                      </p>
                    ) : (
                      <p className="text-xs text-secondary-foreground">Menunggu persetujuan akhir</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void openInspection(row.detailSopId)}>
                      <Eye className="h-4 w-4" aria-hidden />
                      Periksa SOP
                    </Button>
                  {row.approval === null ? (
                    <Button size="sm" className="gap-1.5" disabled={isApproving} onClick={() => setSelectedId(row.detailSopId)}>
                      <Check className="h-4 w-4" aria-hidden />
                      Setujui
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={signProsesBisnisSop.isPending}
                      onClick={() => handleOpenSigning(row.detailSopId)}
                    >
                      {signProsesBisnisSop.isPending && signingId === row.detailSopId ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <FileSignature className="h-4 w-4" aria-hidden />
                      )}
                      Tanda tangani
                    </Button>
                  )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DataSurface.Root>

        <DataSurface.Root>
          <DataSurface.Header>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">SOP berlaku dalam kewenangan Anda</h2>
              <p className="text-sm text-secondary-foreground">
                Pencabutan menggunakan kewenangan organisasi yang sama dengan persetujuan akhir. SOP yang dicabut berhenti berlaku tanpa menghapus riwayat versi, audit, atau bukti TTE.
              </p>
            </div>
          </DataSurface.Header>
          <div className="divide-y divide-border">
            {isLoadingRevocations ? (
              <p className="p-4 text-sm text-secondary-foreground">Memuat SOP berlaku...</p>
            ) : revocationRows.length === 0 ? (
              <p className="p-4 text-sm text-secondary-foreground">Tidak ada SOP berlaku yang dapat dicabut dalam kewenangan Anda.</p>
            ) : (
              revocationRows.map((row) => (
                <div key={row.detailSopId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground">{row.judul}</h3>
                      <Badge variant="outline">
                        {row.lingkup === 'FACULTY' ? 'Fakultas · Dekan' : `${row.departmentNama ?? 'Departemen'} · Kepala Departemen`}
                      </Badge>
                    </div>
                    <p className="text-sm text-secondary-foreground">
                      {row.nomorSOP} · v{row.versi} · Proses Bisnis {row.namaProsesBisnis}
                    </p>
                    <p className="text-xs font-medium text-secondary-foreground">Berlaku</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void openInspection(row.detailSopId)}>
                      <Eye className="h-4 w-4" aria-hidden />
                      Periksa SOP
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={isRevoking}
                      onClick={() => setRevokingId(row.detailSopId)}
                    >
                    {isRevoking && revokingId === row.detailSopId ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Ban className="h-4 w-4" aria-hidden />
                    )}
                    Cabut SOP
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DataSurface.Root>

        <ConfirmDialog
          open={selected !== null}
          onOpenChange={(open) => { if (!open) setSelectedId(null) }}
          title="Setujui SOP ini?"
          description={selected ? `${selected.judul} akan dicatat sebagai telah disetujui dan selanjutnya menunggu TTE dari pemegang kewenangan yang sama.` : ''}
          confirmLabel="Ya, setujui"
          onConfirm={async () => {
            if (!selected || isApproving) return
            try {
              await approve(selected.detailSopId)
              setSelectedId(null)
            } catch {
              // Mutation toast owns the error; keep dialog available for retry.
            }
          }}
        />

        <ConfirmDialog
          open={revoking !== null}
          onOpenChange={(open) => { if (!open) setRevokingId(null) }}
          title="Cabut SOP ini?"
          description={revoking ? `${revoking.judul} tidak lagi berlaku setelah dicabut. Riwayat versi, audit, dan bukti TTE tetap dipertahankan.` : ''}
          confirmLabel="Ya, cabut SOP"
          onConfirm={async () => {
            if (!revoking || isRevoking) return
            try {
              await revoke(revoking.detailSopId)
              setRevokingId(null)
            } catch {
              // Mutation toast owns the error; keep dialog available for retry.
            }
          }}
        />
      </ListPageLayout>

      <PinVerificationDialog
        open={signing !== null}
        onOpenChange={(open) => { if (!open) setSigningId(null) }}
        title="Tanda Tangan SOP — PIN TTE"
        description={signing ? `Masukkan PIN TTE untuk mengesahkan ${signing.judul}. Setelah berhasil, versi ini mulai berlaku.` : ''}
        onConfirm={handlePinConfirm}
        confirmLabel="Tanda Tangani"
      />
      <TteSetupRequiredDialog
        open={tteSetupDialogOpen}
        onOpenChange={setTteSetupDialogOpen}
      />
      <Dialog
        open={inspectId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setInspectId(null)
            setInspectDocument(null)
            setInspectError(null)
          }
        }}
      >
        <DialogContent className="flex h-[calc(100dvh-2rem)] max-w-6xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Periksa dokumen SOP</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden p-0">
            <SopDocumentPreviewPane
              selectedSop={inspectId ? { nama: 'Dokumen SOP', nomor: inspectId } : null}
              isLoading={isInspecting}
              sopPreviewProps={
                inspectDocument ? mapPenyusunWorkbenchToPreviewProps(inspectDocument.workbench) : null
              }
              tteSignaturePayload={inspectDocument?.workbench.tteSignaturePayload}
              errorMessage={inspectError ?? undefined}
              onRetry={inspectId ? () => void openInspection(inspectId) : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
