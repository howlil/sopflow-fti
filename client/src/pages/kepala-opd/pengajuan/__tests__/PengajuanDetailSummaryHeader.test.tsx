import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PengajuanDetailSummaryHeader } from '../PengajuanDetailSummaryHeader'

describe('PengajuanDetailSummaryHeader', () => {
  it('renders a compact scan-friendly summary with contextual actions', () => {
    render(
      <PengajuanDetailSummaryHeader
        opdName="Dinas Kesehatan Provinsi"
        jenis="Pengajuan Baru"
        nomorBA="BA-001"
        tanggalTTDBaPjPenyusun="2026-08-14T00:00:00.000Z"
        sopCount={1}
        status="SELESAI"
        statusLabel="Pengajuan evaluasi selesai"
        actions={<button type="button">Cetak</button>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Pengajuan Evaluasi' })).toBeInTheDocument()
    expect(screen.queryByText('Informasi Pengajuan')).not.toBeInTheDocument()
    expect(screen.getByText('Dinas Kesehatan Provinsi')).toBeInTheDocument()
    expect(screen.getByText('BA-001')).toBeInTheDocument()
    expect(screen.getByText('Pengajuan evaluasi selesai')).toBeInTheDocument()
    expect(screen.getByText('Jumlah SOP')).toBeInTheDocument()
    expect(within(screen.getByText('Jumlah SOP').closest('div')!).getByText('1 dokumen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cetak' })).toBeInTheDocument()
  })
})
