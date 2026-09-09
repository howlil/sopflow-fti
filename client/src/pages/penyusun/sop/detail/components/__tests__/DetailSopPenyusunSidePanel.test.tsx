import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/pages/penyusun/sop/detail/components/DetailSopMetadataPanel', () => ({
  DetailSOPMetadataPanel: () => <div>Metadata probe</div>,
}))
vi.mock('@/pages/penyusun/sop/components/RiwayatVersiPanel', () => ({
  RiwayatVersiPanel: () => <div>Versi probe</div>,
}))
import { DetailSOPPenyusunSidePanel } from '@/pages/penyusun/sop/detail/components/DetailSopPenyusunSidePanel'

function renderPanel(isReadOnly = false) {
  return render(
    <DetailSOPPenyusunSidePanel
      collapsed={false}
      onCollapsedChange={vi.fn()}
      rightPanelTab="edit"
      onTabChange={vi.fn()}
      auditEntries={[]}
      isReadOnly={isReadOnly}
      detailSopId="detail-1"
      sopId="sop-1"
    />,
  )
}

describe('DetailSOPPenyusunSidePanel', () => {
  it('menamai panel metadata sebagai Properti saat editable', () => {
    renderPanel(false)

    expect(screen.getByRole('tab', { name: 'Properti' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Versi' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Aktivitas' })).toBeInTheDocument()
  })

  it('menamai panel metadata sebagai Informasi saat read-only', () => {
    renderPanel(true)

    expect(screen.getByRole('tab', { name: 'Informasi' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Properti' })).not.toBeInTheDocument()
  })

  it('menampilkan catatan keputusan pada tab Evaluasi', () => {
    render(
      <DetailSOPPenyusunSidePanel
        collapsed={false}
        onCollapsedChange={vi.fn()}
        rightPanelTab="review"
        onTabChange={vi.fn()}
        detailSopId="detail-1"
        auditEntries={[
          {
            id: 'review-1',
            sopDetailId: 'detail-1',
            userId: 'owner-1',
            bagian: 'REVIEW',
            keterangan: 'Revisi diminta: lengkapi keluaran langkah 2.',
            aktorRole: '',
            createdAt: '2026-09-10T08:00:00.000Z',
            closedAt: '2026-09-10T08:00:00.000Z',
            user: { id: 'owner-1', nama: 'Owner Proses', email: 'owner@example.test' },
          },
        ]}
      />,
    )

    expect(screen.getByText('Evaluasi')).toBeInTheDocument()
    expect(screen.getByText('Revisi diminta: lengkapi keluaran langkah 2.')).toBeInTheDocument()
    expect(screen.getByText('Owner Proses')).toBeInTheDocument()
  })
})
