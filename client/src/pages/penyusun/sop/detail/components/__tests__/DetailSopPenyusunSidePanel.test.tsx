import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/pages/penyusun/sop/detail/components/DetailSopMetadataPanel', () => ({
  DetailSOPMetadataPanel: () => <div>Metadata probe</div>,
}))
vi.mock('@/pages/penyusun/sop/components/RiwayatVersiPanel', () => ({
  RiwayatVersiPanel: () => <div>Versi probe</div>,
}))
vi.mock('@/pages/penyusun/sop/components/RiwayatStatusPanel', () => ({
  RiwayatStatusPanel: () => <div>Aktivitas probe</div>,
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
})
