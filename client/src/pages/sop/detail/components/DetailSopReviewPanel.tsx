import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, MessageSquare, RotateCcw } from 'lucide-react'
import { pemeriksaanProsesBisnisApi, type KeputusanPemeriksaanProsesBisnis } from '@/api/pemeriksaan-proses-bisnis'
import { queryKeys } from '@/config/query-keys'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface DetailSopReviewPanelProps {
  detailSopId: string
  canReview: boolean
}

export function DetailSopReviewPanel({ detailSopId, canReview }: DetailSopReviewPanelProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [reviewNote, setReviewNote] = useState('')
  const [decisionToConfirm, setDecisionToConfirm] = useState<KeputusanPemeriksaanProsesBisnis | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setReviewNote('')
    setDecisionToConfirm(null)
  }, [detailSopId])

  if (!canReview) return null

  const handleDecision = async (decision: KeputusanPemeriksaanProsesBisnis) => {
    setIsPending(true)
    try {
      const nextWorkbench = await pemeriksaanProsesBisnisApi.decide(
        detailSopId,
        decision,
        reviewNote.trim() || undefined,
      )
      queryClient.setQueryData(queryKeys.penyusunWorkbench(detailSopId), nextWorkbench)
      await queryClient.invalidateQueries({ queryKey: queryKeys.sop })
      showToast(
        decision === 'ACCEPT'
          ? 'Hasil pemeriksaan disetujui dan SOP siap ditandatangani Pejabat Penandatangan.'
          : 'SOP dikembalikan kepada Tim Penyusun SOP untuk perbaikan.',
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan keputusan pemeriksaan'
      showToast(message, 'error')
    } finally {
      setIsPending(false)
      setDecisionToConfirm(null)
      setReviewNote('')
    }
  }

  return (
    <>
      <div className="space-y-4 px-3 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">Pemeriksaan SOP</h3>
          </div>
          <p className="mt-1 text-xs leading-5 text-secondary-foreground">
            Periksa isi SOP sebagai Penanggung Jawab Proses Bisnis. Pratinjau di sebelah kiri tetap hanya-baca.
          </p>
        </div>

        <div className="rounded-control bg-warning-subtle px-3 py-2.5 text-xs leading-5 text-warning-foreground">
          SOP menunggu keputusan Anda. Catatan akan tersimpan sebagai bukti pemeriksaan dan dikirim bersama keputusan.
        </div>

        <div>
          <Label htmlFor="detail-sop-review-note" required>
            Catatan pemeriksaan SOP
          </Label>
          <Textarea
            id="detail-sop-review-note"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Tuliskan catatan atau perbaikan untuk Penyusun SOP."
            maxLength={2000}
            rows={7}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Wajib diisi jika SOP dikembalikan untuk perbaikan · {reviewNote.length}/2000
          </p>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center gap-1.5 text-danger hover:text-danger"
            disabled={isPending || reviewNote.trim().length === 0}
            onClick={() => setDecisionToConfirm('REVISION')}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Kembalikan untuk perbaikan
          </Button>
          <Button
            type="button"
            className="w-full justify-center gap-1.5"
            disabled={isPending}
            onClick={() => setDecisionToConfirm('ACCEPT')}
          >
            <Check className="h-4 w-4" aria-hidden />
            Setujui Hasil Pemeriksaan
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={decisionToConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDecisionToConfirm(null)
        }}
        title={decisionToConfirm === 'ACCEPT' ? 'Setujui hasil pemeriksaan?' : 'Kembalikan untuk perbaikan?'}
        description={
          decisionToConfirm === 'ACCEPT'
            ? 'SOP akan langsung masuk antrean tanda tangan. Catatan penerimaan bersifat opsional.'
            : 'SOP akan dikembalikan kepada Tim Penyusun SOP bersama catatan pemeriksaan Anda.'
        }
        confirmLabel={decisionToConfirm === 'ACCEPT' ? 'Ya, setujui' : 'Kirim permintaan perbaikan'}
        cancelLabel="Batal"
        onConfirm={() => {
          if (decisionToConfirm !== null && !isPending) {
            const decision = decisionToConfirm
            setDecisionToConfirm(null)
            void handleDecision(decision)
          }
        }}
      />
    </>
  )
}
