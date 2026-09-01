import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SopDocumentPreviewPane } from '../sop-document-preview-pane'

vi.mock('@/hooks/use-sop-preview-diagram-state', () => ({
  useSopPreviewDiagramState: () => ({ diagramMountEnabled: true }),
}))

vi.mock('@/components/sop/sop-preview-template', () => ({
  SOPPreviewTemplate: ({ name, previewOptions, diagramState }: any) => (
    <div data-testid="sop-preview-template">
      <span>{name}</span>
      <span>hide tabs: {String(previewOptions?.hideDiagramTabs)}</span>
      <span>active diagram: {diagramState?.activeTab}</span>
    </div>
  ),
}))

describe('SopDocumentPreviewPane', () => {
  it('places Flowchart and BPMN controls in the preview workbench toolbar', () => {
    render(
      <SopDocumentPreviewPane
        selectedSop={{ nama: 'sop barang', nomor: '1234' }}
        isLoading={false}
        tteSignaturePayload={null}
        sopPreviewProps={{
          name: 'sop barang',
          number: '1234',
          metadata: {},
          prosedurRows: [],
          implementers: [],
        }}
      />,
    )

    const toolbar = screen.getByRole('toolbar', { name: 'Tampilan diagram SOP' })
    expect(toolbar).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flowchart' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'BPMN' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('hide tabs: true')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'BPMN' }))

    expect(screen.getByText('active diagram: bpmn')).toBeInTheDocument()
  })
})
