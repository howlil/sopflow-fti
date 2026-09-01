import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DetailSummaryHeader } from '../detail-summary-header'

describe('DetailSummaryHeader', () => {
  it('keeps task title, status, summary, metadata, and actions in one compact header', () => {
    render(
      <DetailSummaryHeader
        title="Evaluasi SOP"
        status="MENUNGGU_TANDA_TANGAN_BA"
        statusLabel="Menunggu tanda tangan BA"
        summary={
          <>
            <span>Dinas Kesehatan Provinsi</span>
            <span> · 1 dokumen · BA seaksja</span>
          </>
        }
        supportingText="Evaluator: Siti Rahmawati, S.STP · 14 Agustus 2026"
        metadata={[
          { label: 'Jenis', value: 'Evaluasi request evaluator' },
          { label: 'Nilai OPD', value: '3' },
        ]}
        actions={<button type="button">Tanda Tangan BA</button>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Evaluasi SOP' })).toBeInTheDocument()
    expect(screen.getByText('Menunggu tanda tangan BA')).toBeInTheDocument()
    expect(screen.getByText(/Dinas Kesehatan Provinsi/)).toBeInTheDocument()
    expect(screen.getByText(/Evaluator: Siti Rahmawati/)).toBeInTheDocument()
    expect(screen.getByText('Jenis')).toBeInTheDocument()
    expect(screen.getByText('Evaluasi request evaluator')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tanda Tangan BA' })).toBeInTheDocument()
  })
})
