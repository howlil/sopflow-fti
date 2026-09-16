import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/pages/sop/detail/components/DetailSopMetadataPanel', () => ({
  DetailSOPMetadataPanel: () => <div>Metadata probe</div>,
}))
vi.mock('@/pages/sop/components/RiwayatVersiPanel', () => ({
  RiwayatVersiPanel: () => <div>Versi probe</div>,
}))
vi.mock('@/pages/sop/detail/components/DetailSopReviewPanel', () => ({
  DetailSopReviewPanel: () => <div>Pemeriksaan panel probe</div>,
}))
import { DetailSOPPenyusunSidePanel } from '@/pages/sop/detail/components/DetailSopPenyusunSidePanel'

function renderPanel(isReadOnly = false) {
  return render(
    <DetailSOPPenyusunSidePanel
      collapsed={false}
      onCollapsedChange={vi.fn()}
      rightPanelTab="edit"
      onTabChange={vi.fn()}
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
    expect(screen.queryByRole('tab', { name: 'Aktivitas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Evaluasi' })).not.toBeInTheDocument()
  })

  it('menamai panel metadata sebagai Informasi saat read-only', () => {
    renderPanel(true)

    expect(screen.getByRole('tab', { name: 'Informasi' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Properti' })).not.toBeInTheDocument()
  })

  it('menampilkan panel review hanya untuk penanggung jawab yang sedang mereview', () => {
    render(
      <DetailSOPPenyusunSidePanel
        collapsed={false}
        onCollapsedChange={vi.fn()}
        rightPanelTab="review"
        onTabChange={vi.fn()}
        canReview
        detailSopId="detail-1"
        sopId="sop-1"
      />,
    )

    expect(screen.getByRole('tab', { name: /Pemeriksaan/ })).toBeInTheDocument()
    expect(screen.getByText('Pemeriksaan panel probe')).toBeInTheDocument()
  })

})
