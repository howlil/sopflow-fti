import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Check,
  CloudOff,
  CloudUpload,
  GitBranchPlus,
  MoreHorizontal,
  Printer,
  RefreshCcw,
  RotateCcw,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SopStatusBadge } from '@/components/status/sop-status-badge'
import { cn } from '@/utils/cn'
import type { SOPDetailMetadata } from '@/types/ui/sop'
import type { PenyusunWorkbenchData, StatusSOP } from '@/types/dto/sop.dto'
import type { SopHeaderAutosaveStatus } from '@/pages/penyusun/sop/hooks/use-sop-header-autosave'
import { usePenyusunWorkbench } from '@/api/sop'
import { processReviewApi, type ProcessReviewDecision } from '@/api/process-review'
import { queryKeys } from '@/config/query-keys'
import { useSopEditor } from '../SopEditorContext'
import { useToast } from '@/hooks/useToast'
import { printSopArsipFromPreviewProps } from '@/lib/print/pengajuan-print'
import { mapPenyusunWorkbenchToPreviewProps } from '@/lib/sop/detailSop.mappers'

export interface DetailSOPPenyusunHeaderProps {
  metadata: SOPDetailMetadata
  currentSopStatus: StatusSOP
  currentSopStatusLabel: string
  autosaveStatus?: SopHeaderAutosaveStatus
  onRetryAutosave?: () => void | Promise<void>
  isReadOnly?: boolean
  canBuatVersiBaru?: boolean
  buatVersiBaruBlockingReason?: string | null
  onBuatVersiBaru?: () => void
  isBuatVersiBaruPending?: boolean
}

interface AutosaveAppearance {
  Icon: typeof Save
  label: string
  className: string
}

type ProcessAwareWorkbenchSop = NonNullable<PenyusunWorkbenchData['detail']['sop']> & {
  processId?: string | null
  processNama?: string | null
}

function autosaveAppearance(status: SopHeaderAutosaveStatus): AutosaveAppearance | null {
  switch (status) {
    case 'pending':
      return { Icon: CloudUpload, label: 'Perubahan menunggu disimpan', className: 'text-secondary-foreground' }
    case 'saving':
      return { Icon: CloudUpload, label: 'Menyimpan...', className: 'text-secondary-foreground' }
    case 'saved':
      return { Icon: Check, label: 'Tersimpan', className: 'text-muted-foreground' }
    case 'error':
      return { Icon: CloudOff, label: 'Gagal menyimpan', className: 'text-danger' }
    case 'idle':
    default:
      return null
  }
}

export function DetailSOPPenyusunHeader({
  metadata,
  currentSopStatus,
  currentSopStatusLabel,
  autosaveStatus = 'idle',
  onRetryAutosave,
  isReadOnly = false,
  canBuatVersiBaru = false,
  buatVersiBaruBlockingReason = null,
  onBuatVersiBaru,
  isBuatVersiBaruPending = false,
}: DetailSOPPenyusunHeaderProps) {
  const { sopDetailId, flushHeaderAutosave, flushProsedurAutosave } = useSopEditor()
  const { data: workbench, isLoading: isWorkbenchLoading } = usePenyusunWorkbench(sopDetailId)
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [isPrinting, setIsPrinting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [reviewDecision, setReviewDecision] = useState<ProcessReviewDecision | null>(null)
  const [isProcessActionPending, setIsProcessActionPending] = useState(false)

  const processSop = workbench?.detail.sop as ProcessAwareWorkbenchSop | undefined
  const processId = processSop?.processId ?? null
  const isProcessWorkflow = processId !== null
  const lifecycle = isProcessWorkflow ? workbench?.lifecycle : undefined
  const isProcessOwner = lifecycle?.stage === 'PROCESS_REVIEW' && lifecycle.responsibility.type === 'CURRENT_USER'
  const isWaitingForProcessReview = lifecycle?.stage === 'PROCESS_REVIEW'
  const isProcessRevision = lifecycle?.stage === 'AUTHORING' && lifecycle.stateLabel === 'Perlu revisi'
  const displayedStatusLabel = lifecycle?.stateLabel ?? currentSopStatusLabel

  const updateWorkbenchCache = (nextWorkbench: PenyusunWorkbenchData) => {
    if (!sopDetailId) return
    queryClient.setQueryData(queryKeys.penyusunWorkbench(sopDetailId), nextWorkbench)
  }

  const handlePrintSop = async () => {
    if (isWorkbenchLoading) return
    setIsPrinting(true)
    try {
      if (!workbench) {
        showToast('Data SOP belum siap untuk dicetak.', 'error')
        return
      }
      const previewProps = mapPenyusunWorkbenchToPreviewProps(workbench)
      const { diagramExportFailed } = await printSopArsipFromPreviewProps(
        previewProps,
        workbench.tteSignaturePayloadKepalaOpd ?? null,
        { signPdf: false },
      )
      if (diagramExportFailed) {
        showToast(
          'Beberapa halaman diagram tidak dapat diekspor; PDF tetap dicetak dengan tabel langkah.',
          'error',
        )
      }
    } catch {
      showToast('Gagal memuat cetak. Coba muat ulang halaman.', 'error')
    } finally {
      setIsPrinting(false)
    }
  }

  const submitProcessReview = async () => {
    if (!sopDetailId) {
      showToast('Detail SOP belum tersedia.', 'error')
      return
    }
    setIsProcessActionPending(true)
    try {
      await Promise.all([flushHeaderAutosave(), flushProsedurAutosave()])
      const nextWorkbench = await processReviewApi.submit(sopDetailId)
      updateWorkbenchCache(nextWorkbench)
      showToast('SOP berhasil dikirim ke Process Owner untuk review.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengirim SOP untuk review'
      showToast(message, 'error')
    } finally {
      setIsProcessActionPending(false)
    }
  }

  const decideProcessReview = async (decision: ProcessReviewDecision) => {
    if (!sopDetailId) {
      showToast('Detail SOP belum tersedia.', 'error')
      return
    }
    setIsProcessActionPending(true)
    try {
      const nextWorkbench = await processReviewApi.decide(sopDetailId, decision)
      updateWorkbenchCache(nextWorkbench)
      showToast(
        decision === 'ACCEPT'
          ? 'SOP diterima dan siap menuju persetujuan akhir.'
          : 'SOP dikembalikan ke Process Team untuk revisi.',
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan keputusan review'
      showToast(message, 'error')
    } finally {
      setIsProcessActionPending(false)
      setReviewDecision(null)
    }
  }

  const indicator = isReadOnly ? null : autosaveAppearance(autosaveStatus)
  const hasPrintAction = currentSopStatus === 'BERLAKU'
  const hasVersionAction = canBuatVersiBaru && onBuatVersiBaru !== undefined
  const hasSecondaryActions = hasPrintAction || hasVersionAction
  const documentTitle = metadata.nama ?? metadata.judul ?? 'SOP'

  const confirmTitle = isProcessRevision ? 'Kirim revisi untuk review?' : 'Kirim SOP untuk review?'
  const confirmDescription = isProcessWorkflow
    ? isProcessRevision
      ? 'Dokumen akan dikirim kembali ke Process Owner. Pastikan semua perubahan sudah tersimpan.'
      : 'Dokumen akan dikunci sementara dan masuk ke review Process Owner. Pastikan semua perubahan sudah tersimpan.'
    : ''
  const confirmLabel = isProcessWorkflow
    ? 'Ya, kirim untuk review'
    : 'Ya, kirim untuk review'

  const handleConfirmComplete = () => {
    setIsConfirmOpen(false)
    if (isProcessWorkflow) {
      void submitProcessReview()
      return
    }
    void submitProcessReview()
  }

  return (
    <>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{documentTitle}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>v{metadata.version || 1}</span>
            {metadata.revisiDariVersi != null ? <span>Revisi dari v{metadata.revisiDariVersi}</span> : null}
            <SopStatusBadge
              status={currentSopStatus}
              label={displayedStatusLabel}
              showDomain={false}
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {indicator !== null ? (
            <span
              role="status"
              aria-live="polite"
              className={cn('inline-flex h-8 items-center gap-1.5 text-xs font-medium', indicator.className)}
              title={
                autosaveStatus === 'error'
                  ? 'Autosave SOP gagal — gunakan Coba lagi untuk mengirim ulang perubahan.'
                  : 'Status autosave SOP'
              }
            >
              <indicator.Icon className="h-3.5 w-3.5" aria-hidden />
              {indicator.label}
            </span>
          ) : null}

          {autosaveStatus === 'error' && !isReadOnly && onRetryAutosave !== undefined ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 px-2.5 text-xs text-danger"
              onClick={() => void onRetryAutosave()}
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
              Coba lagi
            </Button>
          ) : null}

          {!isReadOnly && isProcessWorkflow ? (
            <Button
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={() => setIsConfirmOpen(true)}
              disabled={
                isProcessActionPending
              }
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              {isProcessActionPending
                ? 'Mengirim…'
                : 'Kirim untuk review'}
            </Button>
          ) : null}

          {isWaitingForProcessReview && isProcessOwner ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={() => setReviewDecision('REVISION')}
                disabled={isProcessActionPending}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Minta revisi
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={() => setReviewDecision('ACCEPT')}
                disabled={isProcessActionPending}
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
                Terima
              </Button>
            </>
          ) : null}

          {hasSecondaryActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Aksi dokumen lainnya">
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[11rem]">
                {hasPrintAction ? (
                  <DropdownMenuItem disabled={isWorkbenchLoading || isPrinting} onSelect={() => void handlePrintSop()}>
                    <Printer className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
                    {isPrinting ? 'Menyiapkan…' : 'Cetak PDF'}
                  </DropdownMenuItem>
                ) : null}
                {hasVersionAction ? (
                  <DropdownMenuItem
                    disabled={isBuatVersiBaruPending || Boolean(buatVersiBaruBlockingReason)}
                    onSelect={onBuatVersiBaru}
                    title={buatVersiBaruBlockingReason ?? undefined}
                  >
                    <GitBranchPlus className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
                    {isBuatVersiBaruPending ? 'Membuat…' : 'Buat versi baru'}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {isWaitingForProcessReview ? (
        <div className="mt-2 border-t border-border pt-2 text-xs text-secondary-foreground">
          {isProcessOwner
            ? 'Dokumen menunggu keputusan Anda sebagai Process Owner.'
            : 'Dokumen sedang direview oleh Process Owner dan untuk sementara bersifat read-only.'}
        </div>
      ) : isProcessRevision && !isReadOnly ? (
        <div className="mt-2 flex gap-2 border-t border-border pt-2 text-xs text-secondary-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden />
          <p>
            <>SOP dikembalikan oleh Process Owner. Selesaikan revisi lalu klik <span className="font-semibold">Kirim untuk review</span>.</>
          </p>
        </div>
      ) : null}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        cancelLabel="Batal"
        onConfirm={handleConfirmComplete}
      />

      <ConfirmDialog
        open={reviewDecision !== null}
        onOpenChange={(open) => {
          if (!open) setReviewDecision(null)
        }}
        title={reviewDecision === 'ACCEPT' ? 'Terima SOP?' : 'Kembalikan untuk revisi?'}
        description={
          reviewDecision === 'ACCEPT'
            ? 'SOP akan ditandai siap menuju persetujuan akhir. Tahap persetujuan Dean/Kadep belum dijalankan pada aksi ini.'
            : 'SOP akan kembali dapat diedit oleh Process Team untuk memperbaiki dokumen.'
        }
        confirmLabel={reviewDecision === 'ACCEPT' ? 'Ya, terima' : 'Ya, minta revisi'}
        cancelLabel="Batal"
        onConfirm={() => {
          if (reviewDecision !== null) void decideProcessReview(reviewDecision)
        }}
      />
    </>
  )
}
