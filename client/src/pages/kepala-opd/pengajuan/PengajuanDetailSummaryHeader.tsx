import type { ReactNode } from 'react'
import { DetailSummaryHeader } from '@/components/evaluasi/detail-summary-header'
import { formatDateIdFull } from '@/utils/format-date'

export interface PengajuanDetailSummaryHeaderProps {
  opdName: string
  jenis: string
  nomorBA?: string | null
  tanggalTTDBaPjPenyusun?: string | Date | null
  sopCount: number
  status: string
  statusLabel: string
  actions?: ReactNode
}

export function PengajuanDetailSummaryHeader({
  opdName,
  jenis,
  nomorBA,
  tanggalTTDBaPjPenyusun,
  sopCount,
  status,
  statusLabel,
  actions,
}: PengajuanDetailSummaryHeaderProps) {
  const baNumber = nomorBA?.trim() ? nomorBA : '—'

  return (
    <DetailSummaryHeader
      title="Pengajuan Evaluasi"
      status={status}
      statusLabel={statusLabel}
      summary={
        <>
          <span className="font-medium text-foreground">{opdName || '—'}</span>
          <span className="mx-1.5 text-muted-foreground">·</span>
          {sopCount} dokumen
          <span className="mx-1.5 text-muted-foreground">·</span>
          BA <span className="font-mono text-foreground">{baNumber}</span>
        </>
      }
      metadata={[
        { label: 'Jenis', value: jenis || '—' },
        { label: 'Tanggal BA', value: formatDateIdFull(tanggalTTDBaPjPenyusun) },
        { label: 'Jumlah SOP', value: `${sopCount} dokumen` },
      ]}
      actions={actions}
    />
  )
}
