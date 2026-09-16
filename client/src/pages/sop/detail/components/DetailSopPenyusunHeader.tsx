import { useState } from 'react'
import { Link } from '@tanstack/react-router'
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
import type { SopHeaderAutosaveStatus } from '@/pages/sop/hooks/use-sop-header-autosave'
import { usePenyusunWorkbench } from '@/api/sop'
import { useToast } from '@/hooks/useToast'
import { printSopArsipFromPreviewProps } from '@/lib/print/pengajuan-print'
import { mapPenyusunWorkbenchToPreviewProps } from '@/lib/sop/detailSop.mappers'
import { ROUTES } from '@/utils/constants'

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

type ProsesBisnisAwareWorkbenchSop = NonNullable<PenyusunWorkbenchData['detail']['sop']> & {
  prosesBisnisId?: string | null
  namaProsesBisnis?: string | null
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
  const sopDetailId = metadata.id
  const { data: workbench, isLoading: isWorkbenchLoading } = usePenyusunWorkbench(sopDetailId)
  const { showToast } = useToast()
  const [isPrinting, setIsPrinting] = useState(false)

  const processSop = workbench?.detail.sop as ProsesBisnisAwareWorkbenchSop | undefined
  const prosesBisnisId = processSop?.prosesBisnisId ?? null
  const isProsesBisnisWorkflow = prosesBisnisId !== null
  const siklus = isProsesBisnisWorkflow ? workbench?.siklus : undefined
  const isProsesBisnisOwner = siklus?.stage === 'PROCESS_REVIEW' && siklus.responsibility.type === 'CURRENT_USER'
  const isProsesBisnisOwnerReadOnly = isProsesBisnisWorkflow && workbench?.canEdit === false
  const isWaitingForPemeriksaanProsesBisnis = siklus?.stage === 'PROCESS_REVIEW'
  const isProsesBisnisRevision = siklus?.stage === 'AUTHORING' && currentSopStatus === 'REVISION_REQUIRED'
  const displayedStatusLabel = siklus?.stateLabel ?? currentSopStatusLabel

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
        workbench.tteSignaturePayload ?? null,
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
  const hasPrintAction = currentSopStatus === 'EFFECTIVE'
  const hasVersionAction = canBuatVersiBaru && onBuatVersiBaru !== undefined
  const hasSecondaryActions = hasPrintAction || hasVersionAction
  const documentTitle = metadata.nama ?? metadata.judul ?? 'SOP'

  return (
    <>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{documentTitle}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>v{metadata.version || 1}</span>
            {metadata.revisiDariVersi != null ? <span>Perbaikan dari v{metadata.revisiDariVersi}</span> : null}
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
                  ? 'Penyimpanan otomatis SOP gagal — gunakan Coba lagi untuk mengirim ulang perubahan.'
                  : 'Status penyimpanan otomatis SOP'
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

          {!isReadOnly &&
          isProsesBisnisWorkflow &&
          (currentSopStatus === 'DRAFT' || currentSopStatus === 'REVISION_REQUIRED') ? (
            <Link
              to={ROUTES.SOP}
              className="inline-flex h-8 items-center gap-1.5 rounded-control bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              Pilih untuk Paket Pemeriksaan
            </Link>
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

      {isWaitingForPemeriksaanProsesBisnis ? (
        <div className="mt-2 border-t border-border pt-2 text-xs text-secondary-foreground">
          {isProsesBisnisOwner
            ? 'Dokumen menunggu keputusan Anda sebagai Penanggung Jawab Proses Bisnis.'
          : 'Dokumen sedang diperiksa oleh Penanggung Jawab Proses Bisnis dan untuk sementara tidak dapat diedit.'}
        </div>
      ) : isProsesBisnisRevision && !isReadOnly ? (
        <div className="mt-2 flex gap-2 border-t border-border pt-2 text-xs text-secondary-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden />
          <p>
            <>SOP dikembalikan oleh Penanggung Jawab Proses Bisnis. Selesaikan perbaikan lalu klik <span className="font-semibold">Kirim untuk diperiksa</span>.</>
          </p>
        </div>
      ) : isProsesBisnisOwnerReadOnly ? (
        <div className="mt-2 border-t border-border pt-2 text-xs text-secondary-foreground">
          Anda sebagai Penanggung Jawab Proses Bisnis hanya dapat membaca SOP dan menulis catatan saat tahap pemeriksaan.
        </div>
      ) : null}

    </>
  )
}
