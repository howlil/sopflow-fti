import { useState } from 'react'
import { Check, FileSignature, Loader2, ShieldCheck } from 'lucide-react'
import { processApprovalApi, useProcessApprovalQueue } from '@/api/process-approval'
import { useTandaTanganiProcessSop } from '@/api/process-tte'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { PinVerificationDialog } from '@/components/tte/pin-verification-dialog'
import { TteSetupRequiredDialog } from '@/components/tte/tte-setup-required-dialog'
import { useRequireTteSetup } from '@/hooks/use-require-tte-setup'
import { useToast } from '@/hooks/useToast'
import { buildSopArsipPdfBase64FromPreviewProps } from '@/lib/print/pengajuan-print'
import { mapPenyusunWorkbenchToPreviewProps } from '@/lib/sop/detailSop.mappers'

export function ProcessApprovalPage() {
  const { rows, isLoading, approve, isApproving } = useProcessApprovalQueue()
  const signProcessSop = useTandaTanganiProcessSop({ suppressSetupRequiredToast: true })
  const {
    tteSetupDialogOpen,
    setTteSetupDialogOpen,
    requireTteReady,
    handleTteSigningError,
  } = useRequireTteSetup()
  const { showToast } = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [signingId, setSigningId] = useState<string | null>(null)
  const selected = rows.find((row) => row.detailSopId === selectedId) ?? null
  const signing = rows.find((row) => row.detailSopId === signingId) ?? null

  const handleOpenSigning = (detailSopId: string) => {
    void requireTteReady(() => setSigningId(detailSopId))
  }

  const handlePinConfirm = async (pin: string): Promise<boolean> => {
    if (signing === null || signProcessSop.isPending) return false
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
      await signProcessSop.mutateAsync({
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
                Persetujuan akhir mengikuti lingkup Process: Dekan untuk Process fakultas dan Kepala Departemen untuk Process departemen. Setelah disetujui, pemegang kewenangan yang sama menyelesaikan TTE agar SOP berlaku.
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
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-secondary-foreground">
                        {row.scope === 'FACULTY' ? 'Fakultas · Dekan' : `${row.departmentNama ?? 'Departemen'} · Kepala Departemen`}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-foreground">
                      {row.nomorSOP} · v{row.versi} · Process {row.processNama}
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
                  {row.approval === null ? (
                    <Button size="sm" className="gap-1.5" disabled={isApproving} onClick={() => setSelectedId(row.detailSopId)}>
                      <Check className="h-4 w-4" aria-hidden />
                      Setujui
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={signProcessSop.isPending}
                      onClick={() => handleOpenSigning(row.detailSopId)}
                    >
                      {signProcessSop.isPending && signingId === row.detailSopId ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <FileSignature className="h-4 w-4" aria-hidden />
                      )}
                      Tanda tangani
                    </Button>
                  )}
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
    </>
  )
}
