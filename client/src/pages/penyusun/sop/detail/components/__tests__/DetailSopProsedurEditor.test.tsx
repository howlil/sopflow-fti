import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ProsedurRow } from '@/types/ui/sop'

const handleAddRow = vi.fn()

vi.mock('@/pages/penyusun/sop/hooks/use-prosedur-editor', () => ({
  useProsedurEditor: () => ({
    isDecisionDialogOpen: false,
    setIsDecisionDialogOpen: vi.fn(),
    decisionStepIndex: null,
    decisionYesId: '',
    decisionNoId: '',
    setDecisionYesId: vi.fn(),
    setDecisionNoId: vi.fn(),
    handleAddRow,
    handleDeleteRow: vi.fn(),
    handleTypeChange: vi.fn(),
    handleKegiatanChange: vi.fn(),
    handlePelaksanaChange: vi.fn(),
    handleMutuKelengkapanChange: vi.fn(),
    handleMutuWaktuChange: vi.fn(),
    handleOutputChange: vi.fn(),
    handleKeteranganChange: vi.fn(),
    handleDecisionConfig: vi.fn(),
  }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

vi.mock('@/lib/sop/validateProsedurRows', () => ({
  validateProsedurRows: () => ({ valid: true, errors: [] }),
  formatProsedurValidationMessage: () => '',
}))

vi.mock('@/pages/penyusun/sop/detail/components/DecisionStepDialog', () => ({
  DecisionStepDialog: () => null,
}))

import { DetailSOPProsedurEditor } from '@/pages/penyusun/sop/detail/components/DetailSopProsedurEditor'

const row: ProsedurRow = {
  id: 'step-1',
  urutan: 1,
  kegiatan: 'Mulai',
  pelaksana: 'Staf',
  pelaksanaIds: ['impl-1'],
  type: 'terminator',
  terminatorRole: 'start',
  mutu_kelengkapan: 'Dokumen',
  mutu_waktu: '5 m',
  output: 'Diterima',
  keterangan: 'Awal',
}

function renderEditor(onDone = vi.fn()) {
  return {
    onDone,
    ...render(
      <DetailSOPProsedurEditor
        prosedurRows={[row]}
        setProsedurRows={vi.fn()}
        implementers={[{ id: 'impl-1', name: 'Staf' }]}
        onDone={onDone}
      />,
    ),
  }
}

describe('DetailSOPProsedurEditor', () => {
  it('mempertahankan semua kolom dalam satu desktop spreadsheet scroll region', () => {
    renderEditor()

    const desktopScroll = screen.getByTestId('procedure-editor-scroll')
    expect(desktopScroll).toBeInTheDocument()
    for (const column of [
      'No',
      'Kegiatan',
      'Tipe',
      'Pelaksana',
      'Kelengkapan',
      'Waktu',
      'Output',
      'Keterangan',
      'Aksi',
    ]) {
      expect(within(desktopScroll).getByRole('columnheader', { name: column })).toBeInTheDocument()
    }
    expect(within(desktopScroll).getByRole('button', { name: 'Aksi langkah 1' })).toBeInTheDocument()
  })

  it('mempertahankan aksi tambah langkah dan selesai edit', () => {
    const onDone = vi.fn()
    renderEditor(onDone)

    fireEvent.click(screen.getByRole('button', { name: 'Tambah langkah' }))
    expect(handleAddRow).toHaveBeenCalledWith(1, [{ id: 'impl-1', name: 'Staf' }])

    fireEvent.click(screen.getByRole('button', { name: 'Selesai edit' }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
