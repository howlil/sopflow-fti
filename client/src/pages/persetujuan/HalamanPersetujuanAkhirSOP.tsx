import { useState } from 'react'
import { Ban, Check, Eye, FileSignature, Loader2 } from 'lucide-react'
import { processApprovalApi, useProsesBisnisApprovalQueue } from '@/api/persetujuan-akhir-sop'
import { useProsesBisnisRevocationQueue } from '@/api/pencabutan-sop'
import { useTandaTanganiProsesBisnisSop } from '@/api/tte-proses-bisnis'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Table } from '@/components/ui/data-table'
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

  const scopeLabel = (row: { lingkup: string; departmentNama?: string | null }) =>
    row.lingkup === 'FACULTY'
      ? 'Fakultas · Dekan'
      : `${row.departmentNama ?? 'Departemen'} · Kepala Departemen`

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
        showToast(error instanceof Error ? error.message : 'Gagal menyiapkan dokumen resmi SOP.', 'error')
      }
      return false
    }
  }

  return (
    <>
      <ListPageLayout
        breadcrumb={[{ label: 'SOP' }, { label: 'Pengesahan & TTE' }]}
        title="Pengesahan & TTE"
        description="Pejabat Berwenang memeriksa dokumen secara read-only, mengesahkan, lalu menyelesaikan Tanda Tangan Elektronik sesuai lingkup organisasi."
      >
        <section className="space-y-3" aria-labelledby="approval-title">
          <div>
            <h2 id="approval-title" className="text-sm font-semibold text-foreground">Menunggu tindakan Pejabat Berwenang</h2>
            <p className="mt-1 text-sm text-secondary-foreground">Dekan menangani lingkup Fakultas; Kepala Departemen menangani lingkup Departemennya.</p>
          </div>
          <Table.Card>
            <Table.Root aria-label="SOP menunggu pengesahan atau TTE">
              <Table.Table>
                <thead>
                  <Table.HeadRow>
                    <Table.Th>Nomor</Table.Th>
                    <Table.Th>SOP</Table.Th>
                    <Table.Th>Proses Bisnis</Table.Th>
                    <Table.Th>Kewenangan</Table.Th>
                    <Table.Th>Tahap</Table.Th>
                    <Table.ActionTh>Aksi</Table.ActionTh>
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {isLoading ? (
                    <Table.BodyRow><Table.Td colSpan={6}>Memuat daftar pengesahan...</Table.Td></Table.BodyRow>
                  ) : rows.length === 0 ? (
                    <Table.BodyRow><Table.Td colSpan={6}>Tidak ada SOP yang menunggu pengesahan atau TTE Anda.</Table.Td></Table.BodyRow>
                  ) : rows.map((row) => (
                    <Table.BodyRow key={row.detailSopId}>
                      <Table.Td>{row.nomorSOP} · v{row.versi}</Table.Td>
                      <Table.Td className="font-medium">{row.judul}</Table.Td>
                      <Table.Td>{row.namaProsesBisnis}</Table.Td>
                      <Table.Td>{scopeLabel(row)}</Table.Td>
                      <Table.Td>
                        <Badge variant={row.approval ? 'warning' : 'outline'}>
                          {row.approval ? 'Menunggu TTE' : 'Menunggu pengesahan'}
                        </Badge>
                      </Table.Td>
                      <Table.ActionTd>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void openInspection(row.detailSopId)}>
                            <Eye className="h-4 w-4" aria-hidden />
                            Periksa
                          </Button>
                          {row.approval === null ? (
                            <Button size="sm" className="gap-1.5" disabled={isApproving} onClick={() => setSelectedId(row.detailSopId)}>
                              <Check className="h-4 w-4" aria-hidden />
                              Sahkan
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
                              Tanda Tangani
                            </Button>
                          )}
                        </div>
                      </Table.ActionTd>
                    </Table.BodyRow>
                  ))}
                </tbody>
              </Table.Table>
            </Table.Root>
          </Table.Card>
        </section>

        <section className="space-y-3" aria-labelledby="effective-title">
          <div>
            <h2 id="effective-title" className="text-sm font-semibold text-foreground">SOP berlaku dalam kewenangan Anda</h2>
            <p className="mt-1 text-sm text-secondary-foreground">Pencabutan tidak menghapus riwayat versi, audit, atau bukti TTE.</p>
          </div>
          <Table.Card>
            <Table.Root aria-label="SOP berlaku yang dapat dicabut">
              <Table.Table>
                <thead>
                  <Table.HeadRow>
                    <Table.Th>Nomor</Table.Th>
                    <Table.Th>SOP</Table.Th>
                    <Table.Th>Proses Bisnis</Table.Th>
                    <Table.Th>Kewenangan</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.ActionTh>Aksi</Table.ActionTh>
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {isLoadingRevocations ? (
                    <Table.BodyRow><Table.Td colSpan={6}>Memuat SOP berlaku...</Table.Td></Table.BodyRow>
                  ) : revocationRows.length === 0 ? (
                    <Table.BodyRow><Table.Td colSpan={6}>Tidak ada SOP berlaku dalam kewenangan Anda.</Table.Td></Table.BodyRow>
                  ) : revocationRows.map((row) => (
                    <Table.BodyRow key={row.detailSopId}>
                      <Table.Td>{row.nomorSOP} · v{row.versi}</Table.Td>
                      <Table.Td className="font-medium">{row.judul}</Table.Td>
                      <Table.Td>{row.namaProsesBisnis}</Table.Td>
                      <Table.Td>{scopeLabel(row)}</Table.Td>
                      <Table.Td><Badge variant="success">Berlaku</Badge></Table.Td>
                      <Table.ActionTd>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => void openInspection(row.detailSopId)}>
                            <Eye className="mr-1.5 h-4 w-4" aria-hidden />Periksa
                          </Button>
                          <Button size="sm" variant="outline" disabled={isRevoking} onClick={() => setRevokingId(row.detailSopId)}>
                            {isRevoking && revokingId === row.detailSopId ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> : <Ban className="mr-1.5 h-4 w-4" aria-hidden />}
                            Cabut SOP
                          </Button>
                        </div>
                      </Table.ActionTd>
                    </Table.BodyRow>
                  ))}
                </tbody>
              </Table.Table>
            </Table.Root>
          </Table.Card>
        </section>

        <ConfirmDialog
          open={selected !== null}
          onOpenChange={(open) => { if (!open) setSelectedId(null) }}
          title="Sahkan SOP ini?"
          description={selected ? `${selected.judul} akan dicatat sebagai telah disahkan dan selanjutnya menunggu TTE dari Pejabat Berwenang yang sama.` : ''}
          confirmLabel="Ya, Sahkan"
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
          confirmLabel="Ya, Cabut SOP"
          destructive
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
        title="Tanda Tangan Elektronik SOP"
        description={signing ? `Masukkan PIN TTE untuk menandatangani ${signing.judul}. Setelah berhasil, versi ini mulai berlaku.` : ''}
        onConfirm={handlePinConfirm}
        confirmLabel="Tanda Tangani"
      />
      <TteSetupRequiredDialog open={tteSetupDialogOpen} onOpenChange={setTteSetupDialogOpen} />
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
          <DialogHeader><DialogTitle>Periksa Dokumen SOP</DialogTitle></DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden p-0">
            <SopDocumentPreviewPane
              selectedSop={inspectId ? { nama: 'Dokumen SOP', nomor: inspectId } : null}
              isLoading={isInspecting}
              sopPreviewProps={inspectDocument ? mapPenyusunWorkbenchToPreviewProps(inspectDocument.workbench) : null}
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
