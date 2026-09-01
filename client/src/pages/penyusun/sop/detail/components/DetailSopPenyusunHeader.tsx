import { useState } from 'react'
import {
  AlertTriangle,
  Check,
  CloudOff,
  CloudUpload,
  GitBranchPlus,
  MoreHorizontal,
  Printer,
  RefreshCcw,
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
import type { StatusSOP } from '@/types/dto/sop.dto'
import type { SopHeaderAutosaveStatus } from '@/pages/penyusun/sop/hooks/use-sop-header-autosave'
import { usePenyusunWorkbench } from '@/api/sop'
import { useSopEditor } from '../SopEditorContext'
import { useToast } from '@/hooks/useToast'
import { printSopArsipFromPreviewProps } from '@/lib/print/pengajuan-print'
import { mapPenyusunWorkbenchToPreviewProps } from '@/lib/sop/detailSop.mappers'

export interface DetailSOPPenyusunHeaderProps {
  metadata: SOPDetailMetadata
  currentSopStatus: StatusSOP
  currentSopStatusLabel: string
  isRevisionFlow: boolean
  primaryActionLabel: string
  /** Di alur revisi: hanya PJ Penyusun yang melihat tombol kirim ulang. */
  canShowKirimUlangAction?: boolean
  /** Status autosave gabungan header + prosedur. */
  autosaveStatus?: SopHeaderAutosaveStatus
  /** Handler untuk mencoba ulang autosave saat status `error`. */
  onRetryAutosave?: () => void | Promise<void>
  onComplete: () => void
  /** Menonaktifkan tombol aksi utama (mis. saat POST kirim ulang evaluasi). */
  isPrimaryActionPending?: boolean
  /** Mode lihat: sembunyikan autosave, Selesai, dan retry. */
  isReadOnly?: boolean
  /** Pesan blokir kirim ulang (tindak lanjut belum SELESAI). */
  kirimUlangBlockingReason?: string | null
  /** Tampilkan aksi buat versi baru dari versi terminal yang sedang dibuka. */
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

function autosaveAppearance(status: SopHeaderAutosaveStatus): AutosaveAppearance | null {
  switch (status) {
    case 'pending':
      return {
        Icon: CloudUpload,
        label: 'Perubahan menunggu disimpan',
        className: 'text-secondary-foreground',
      }
    case 'saving':
      return {
        Icon: CloudUpload,
        label: 'Menyimpan...',
        className: 'text-secondary-foreground',
      }
    case 'saved':
      return {
        Icon: Check,
        label: 'Tersimpan',
        className: 'text-muted-foreground',
      }
    case 'error':
      return {
        Icon: CloudOff,
        label: 'Gagal menyimpan',
        className: 'text-danger',
      }
    case 'idle':
    default:
      return null
  }
}

export function DetailSOPPenyusunHeader({
  metadata,
  currentSopStatus,
  currentSopStatusLabel,
  isRevisionFlow,
  primaryActionLabel,
  canShowKirimUlangAction = true,
  autosaveStatus = 'idle',
  onRetryAutosave,
  onComplete,
  isPrimaryActionPending = false,
  isReadOnly = false,
  kirimUlangBlockingReason = null,
  canBuatVersiBaru = false,
  buatVersiBaruBlockingReason = null,
  onBuatVersiBaru,
  isBuatVersiBaruPending = false,
}: DetailSOPPenyusunHeaderProps) {
  const { sopDetailId } = useSopEditor()
  const { data: workbench, isLoading: isWorkbenchLoading } = usePenyusunWorkbench(sopDetailId)
  const { showToast } = useToast()
  const [isPrinting, setIsPrinting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

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

  const indicator = isReadOnly ? null : autosaveAppearance(autosaveStatus)
  const hasPrintAction = currentSopStatus === 'BERLAKU'
  const hasVersionAction = canBuatVersiBaru && onBuatVersiBaru !== undefined
  const hasSecondaryActions = hasPrintAction || hasVersionAction
  const documentTitle = metadata.nama ?? metadata.judul ?? 'SOP'

  const confirmTitle = isRevisionFlow ? 'Kirim ulang evaluasi?' : 'Yakin SOP sudah siap?'
  const confirmDescription = isRevisionFlow
    ? (kirimUlangBlockingReason ??
      'SOP akan dikirim ulang untuk evaluasi oleh tim evaluator. Pastikan semua perbaikan sudah tersimpan.')
    : 'Status SOP akan diubah menjadi Menunggu pengajuan evaluasi. PJ Penyusun dapat membuka pengajuan evaluasi ke Biro Organisasi. Pastikan dokumen sudah lengkap sebelum melanjutkan.'
  const confirmLabel = isRevisionFlow ? 'Ya, kirim ulang' : 'Ya, selesai'

  const handleConfirmComplete = () => {
    setIsConfirmOpen(false)
    onComplete()
  }

  return (
    <>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{documentTitle}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>v{metadata.version || 1}</span>
            {metadata.revisiDariVersi != null ? (
              <span>Revisi dari v{metadata.revisiDariVersi}</span>
            ) : null}
            <SopStatusBadge
              status={currentSopStatus}
              label={currentSopStatusLabel}
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

          {!isReadOnly && (!isRevisionFlow || canShowKirimUlangAction) ? (
            <Button
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isPrimaryActionPending || Boolean(kirimUlangBlockingReason)}
              title={kirimUlangBlockingReason ?? undefined}
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              {isPrimaryActionPending ? 'Mengirim…' : primaryActionLabel}
            </Button>
          ) : null}

          {hasSecondaryActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Aksi dokumen lainnya"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[11rem]">
                {hasPrintAction ? (
                  <DropdownMenuItem
                    disabled={isWorkbenchLoading || isPrinting}
                    onSelect={() => void handlePrintSop()}
                  >
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

      {isRevisionFlow && !isReadOnly ? (
        <div className="mt-2 flex gap-2 border-t border-border pt-2 text-xs text-secondary-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden />
          <p>
            {kirimUlangBlockingReason ? (
              kirimUlangBlockingReason
            ) : !canShowKirimUlangAction ? (
              <>
                SOP ini dikembalikan oleh evaluator untuk revisi. Selesaikan perbaikan, lalu minta{' '}
                <span className="font-semibold">PJ Penyusun</span> mengirim ulang evaluasi.
              </>
            ) : (
              <>
                SOP ini dikembalikan oleh evaluator untuk revisi. Pastikan perbaikan tersimpan, lalu
                klik <span className="font-semibold">Kirim ulang evaluasi</span>.
              </>
            )}
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
    </>
  )
}
