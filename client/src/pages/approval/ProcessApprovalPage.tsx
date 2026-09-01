import { useState } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import { useProcessApprovalQueue } from '@/api/process-approval'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'

export function ProcessApprovalPage() {
  const { rows, isLoading, approve, isApproving } = useProcessApprovalQueue()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = rows.find((row) => row.detailSopId === selectedId) ?? null

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'SOP' }, { label: 'Persetujuan Akhir' }]}
      title="Persetujuan Akhir"
    >
      <DataSurface.Root>
        <DataSurface.Header>
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground">SOP dalam scope kewenangan Anda</h2>
            <p className="text-sm text-secondary-foreground">
              Faculty scope disetujui Dean; Department scope disetujui Kepala Departemen terkait. Persetujuan belum membuat SOP BERLAKU sampai TTE selesai.
            </p>
          </div>
        </DataSurface.Header>
        <div className="divide-y divide-border">
          {isLoading ? (
            <p className="p-4 text-sm text-secondary-foreground">Memuat persetujuan...</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-secondary-foreground">Tidak ada SOP yang menunggu persetujuan Anda.</p>
          ) : (
            rows.map((row) => (
              <div key={row.detailSopId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{row.judul}</h3>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-secondary-foreground">
                      {row.scope === 'FACULTY' ? 'Faculty · Dean' : `${row.departmentNama ?? 'Department'} · Kadep`}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-foreground">
                    {row.nomorSOP} · v{row.versi} · Process {row.processNama}
                  </p>
                  {row.approval ? (
                    <p className="inline-flex items-center gap-1 text-xs font-medium text-secondary-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                      Disetujui · menunggu TTE
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
                ) : null}
              </div>
            ))
          )}
        </div>
      </DataSurface.Root>

      <ConfirmDialog
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelectedId(null) }}
        title="Setujui SOP ini?"
        description={selected ? `${selected.judul} akan dicatat sebagai telah mendapat final approval dan selanjutnya menunggu TTE.` : ''}
        confirmLabel="Ya, setujui"
        isLoading={isApproving}
        onConfirm={async () => {
          if (!selected) return
          try {
            await approve(selected.detailSopId)
            setSelectedId(null)
          } catch {
            // Mutation toast owns the error; keep dialog available for retry.
          }
        }}
      />
    </ListPageLayout>
  )
}
