import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SopWorkbenchSidePanel } from '../sop-workbench-side-panel'

describe('SopWorkbenchSidePanel', () => {
  const items = [
    {
      id: 'sop-1',
      nama: 'sop lama',
      nomor: '123456',
      statusDokumen: 'BERLAKU',
      statusDokumenLabel: 'Berlaku',
      hasilEvaluasi: 'SESUAI',
      hasilEvaluasiLabel: 'Sesuai',
    },
  ]

  it('owns the shared workbench width, header density, and compact SOP cards', () => {
    render(
      <SopWorkbenchSidePanel
        collapsed={false}
        onCollapse={vi.fn()}
        onExpand={vi.fn()}
        items={items}
        selectedId="sop-1"
        onSelect={vi.fn()}
      />,
    )

    const panel = screen.getByTestId('sop-workbench-side-panel')
    expect(panel.className).toContain('w-[min(340px,36vw)]')
    expect(screen.getByText('Daftar SOP')).toBeInTheDocument()
    expect(screen.getByText('1 dokumen')).toBeInTheDocument()

    const selectedCard = screen.getByRole('button', { name: /sop lama/i })
    expect(selectedCard).toHaveClass('rounded-control')
    expect(selectedCard).toHaveClass('border-primary')
    expect(selectedCard).toHaveClass('bg-primary-subtle')
  })

  it('keeps the collapsed strip operable', () => {
    render(
      <SopWorkbenchSidePanel
        collapsed
        onCollapse={vi.fn()}
        onExpand={vi.fn()}
        items={items}
        selectedId="sop-1"
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /sop/i })).toBeInTheDocument()
  })
})
