import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const editorState = vi.hoisted(() => ({
  isReadOnly: false,
}))

const diagramState = vi.hoisted(() => ({
  isEditingDiagramPaths: false,
}))

vi.mock('@/components/sop/sop-preview-template', () => ({
  SOPPreviewTemplate: ({
    previewOptions,
  }: {
    previewOptions?: { toolbar?: ReactNode; diagramAlternate?: ReactNode }
  }) => (
    <div>
      {previewOptions?.toolbar}
      {previewOptions?.diagramAlternate}
    </div>
  ),
}))

vi.mock('@/pages/penyusun/sop/detail/SopEditorContext', () => ({
  useSopEditor: () => ({
    sopDetailId: 'detail-1',
    metadata: { nama: 'SOP Uji', version: 1 },
    prosedurRows: [],
    setProsedurRows: vi.fn(),
    implementers: [],
    isReadOnly: editorState.isReadOnly,
  }),
}))

vi.mock('@/api/sop', () => ({
  usePenyusunWorkbench: () => ({
    data: { detail: { id: 'detail-1' } },
    isLoading: false,
  }),
}))

vi.mock('@/pages/penyusun/sop/detail/components/DetailSopProsedurEditor', () => ({
  DetailSOPProsedurEditor: () => <div>Procedure editor</div>,
}))

vi.mock('@/pages/penyusun/sop/hooks/use-penyusun-diagram-config', () => ({
  usePenyusunDiagramConfig: () => ({
    isDiagramHydrated: true,
    isEditingDiagramPaths: diagramState.isEditingDiagramPaths,
    setIsEditingDiagramPaths: vi.fn(),
    setSelectedConnectionId: vi.fn(),
    selectedConnectionId: null,
    handleResetAllPaths: vi.fn(),
    pathLayoutSeed: 0,
    effectiveArrowConfig: {},
    labelConfig: {},
    handleManualPathChange: vi.fn(),
    handleResetSelectedPath: vi.fn(),
  }),
}))

import { DetailSOPPenyusunMain } from '@/pages/penyusun/sop/detail/components/DetailSopPenyusunMain'

function renderMain(isEditingSteps = false) {
  return render(
    <DetailSOPPenyusunMain
      activeTab="flowchart"
      onActiveTabChange={vi.fn()}
      isEditingSteps={isEditingSteps}
      setIsEditingSteps={vi.fn()}
    />,
  )
}

describe('DetailSOPPenyusunMain toolbar', () => {
  beforeEach(() => {
    editorState.isReadOnly = false
    diagramState.isEditingDiagramPaths = false
  })

  it('menandai mode langkah dan edit path dengan aria-pressed', () => {
    renderMain(false)

    expect(screen.getByRole('button', { name: 'Langkah' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Edit Manual' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('menandai mode langkah aktif saat editor prosedur terbuka', () => {
    renderMain(true)

    expect(screen.getByRole('button', { name: 'Diagram' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('menyembunyikan kontrol edit saat mode read-only', () => {
    editorState.isReadOnly = true
    renderMain(false)

    expect(screen.queryByRole('button', { name: 'Langkah' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit Manual' })).not.toBeInTheDocument()
  })
})
